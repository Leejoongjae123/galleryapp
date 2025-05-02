"use client";

import React, { useState, useEffect } from "react";
import { ExhibitionList } from "../components/exhibition-list";
import { ExhibitionDetail } from "../components/exhibition-detail";
import { Button, Input, Pagination, Switch, Textarea, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { addToast } from "@heroui/react";
import useUserInfoStore from "../store/userInfo";
import { v4 as uuidv4 } from 'uuid';

// 날짜 범위를 포맷팅하는 함수
const formatDateRange = (startDate, endDate) => {
  try {
    // ISO 문자열에서 Date 객체 생성
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 유효한 날짜인지 확인
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDate} ~ ${endDate}`;
    }

    // YYYY.MM.DD 형식으로 포맷팅
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    };

    return `${formatDate(start)} ~ ${formatDate(end)}`;
  } catch (error) {
    // 오류 발생 시 원본 값 반환
    console.error("날짜 포맷팅 오류:", error);
    return `${startDate} ~ ${endDate}`;
  }
};

export default function Exhibition() {
  const { userInfo,setUserInfo } = useUserInfoStore();
  // Supabase 클라이언트 생성
  const supabase = createClient();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // 상태 관리
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedKey, setSelectedKey] = useState(new Set([]));
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [galleryInfo, setGalleryInfo] = useState(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchUserInfo = async () => {
      const {data:user, error} = await supabase.auth.getUser();
      if (error) {
        console.error('사용자 정보 가져오기 오류:', error);
      } else {
        const {data:userInfo, error:userInfoError} = await supabase.from('profiles').select('*').eq('id', user?.user?.id).single();
        if (userInfoError) {
          console.error('사용자 정보 가져오기 오류:', userInfoError);
        } else {
          setUserInfo(userInfo);
        }
      }
    };
    fetchUserInfo();

  }, []);

  useEffect(() => {
    if (userInfo?.url) {
      const fetchGalleryInfo = async () => {
        const { data, error } = await supabase
          .from("gallery")
          .select("*")
          .eq("url", userInfo?.url) 
          .single();

      if (error) {
        console.log("갤러리 정보를 가져오는 중 오류 발생:", error);
      } else {
        setGalleryInfo(data);
      }
    };

      fetchGalleryInfo();
    }
  }, [userInfo?.url]);
  console.log("galleryInfo", galleryInfo);

  // 전시회 데이터 로드 함수
  const loadExhibitions = async () => {
    if (userInfo?.url) {
      setIsLoading(true);
      try {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage - 1;

        let query = supabase
          .from("exhibition")
          .select("*", { count: "exact" })
          .range(start, end)
          .order("created_at", { ascending: false })
          .eq("naver_gallery_url", userInfo?.url);

        if (searchTerm) {
          query = query.or(
            `name.ilike.%${searchTerm}%, contents.ilike.%${searchTerm}%, add_info.ilike.%${searchTerm}%`
          );
        }

        const { data, error, count } = await query;

        if (error) throw error;

        setExhibitions(data || []);
        setTotalPages(Math.ceil((count || 0) / itemsPerPage));
      } catch (error) {
        console.error("전시회 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 페이지나 검색어가 변경될 때 데이터 로드
  useEffect(() => {
    loadExhibitions();
  }, [currentPage, searchTerm]);

  // userInfo가 변경될 때 데이터 로드하는 useEffect 추가
  useEffect(() => {
    if (userInfo?.url) {
      loadExhibitions();
    }
  }, [userInfo]);

  // 신규 전시회 생성 핸들러
  const handleNewExhibition = () => {
    setSelectedExhibition(null);
    setIsCreatingNew(true);
    setSelectedKey(new Set([]));
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
    }
  };

  // 신규 전시회 저장 핸들러
  const handleSaveNew = async (newExhibition) => {
    try {
      // 날짜 값 처리 - 반드시 end_date도 포함되도록 확인
      const startDate = newExhibition.start_date || null;
      const endDate = newExhibition.end_date || null;
      
      console.log("신규 Supabase로 전송할 날짜 데이터:", {
        start_date: startDate,
        end_date: endDate
      });
      
      // Supabase에 새 전시회 데이터 저장 - end_date 확인
      const { data, error } = await supabase
        .from("exhibition")
        .insert([
          {
            name: newExhibition.name || "",
            contents: newExhibition.contents || "",
            photo: newExhibition.photo || "",
            start_date: startDate,
            end_date: endDate, // 반드시 포함
            working_hour: newExhibition.working_hour || "",
            off_date: newExhibition.off_date || "",
            add_info: newExhibition.add_info || "",
            homepage_url: newExhibition.homepage_url || "",
            isFree: newExhibition.isFree || false,
            isRecommended: newExhibition.isRecommended || false,
            naver_gallery_url: userInfo.url,
            price: newExhibition.price || 0,
          },
        ])
        .select();

      if (error) throw error;

      // 저장된 데이터로 상태 업데이트
      const savedExhibition = data[0];
      setIsCreatingNew(false);
      setSelectedExhibition(savedExhibition);
      setSelectedKey(new Set([savedExhibition.id.toString()]));

      // 데이터 새로고침
      loadExhibitions();
    } catch (error) {
      console.error("전시회 저장 중 오류 발생:", error);
    }
  };

  // 전시회 선택 핸들러
  const handleSelectExhibition = (exhibition) => {
    if (isCreatingNew) {
      setIsCreatingNew(false);
    }

    setSelectedExhibition(exhibition);
    setSelectedKey(new Set([exhibition.id.toString()]));
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (field, value) => {
    setSelectedExhibition({
      ...selectedExhibition,
      [field]: value,
    });
  };

  // 이미지 업로드 및 처리 핸들러
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "업로드 오류",
          description: "파일 크기는 5MB 이하여야 합니다.",
          color: "danger",
        });
        return;
      }

      // 파일 형식 제한
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        addToast({
          title: "업로드 오류",
          description: "JPG, PNG, GIF, WEBP 형식의 이미지만 업로드할 수 있습니다.",
          color: "danger",
        });
        return;
      }

      // 업로드 중임을 표시
      setIsLoading(true);

      // 파일 이름은 고유하게 생성 (UUID + 원본 파일명)
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `exhibition/${fileName}`;
      
      // Supabase storage에 이미지 업로드
      const { data, error } = await supabase.storage
        .from('exhibition')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // 업로드된 이미지의 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('exhibition')
        .getPublicUrl(filePath);

      // 이미지 URL을 전시회 정보에 저장
      handleFieldChange('photo', publicUrlData.publicUrl);

      addToast({
        title: "업로드 성공",
        description: "이미지가 성공적으로 업로드되었습니다.",
        color: "success",
      });
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      addToast({
        title: "업로드 오류",
        description: `이미지 업로드 중 오류가 발생했습니다: ${error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 업데이트 핸들러
  const handleUpdate = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      // 날짜 값 처리 - 반드시 end_date도 포함되도록 확인
      const startDate = selectedExhibition.start_date || null;
      const endDate = selectedExhibition.end_date || null;
      
      // 디버깅을 위한 로그 추가
      console.log("Supabase로 전송할 날짜 데이터:", {
        start_date: startDate,
        end_date: endDate
      });
      
      // DB 업데이트 전 end_date가 있는지 확인
      if (!endDate) {
        console.warn("end_date가 비어 있습니다. 업데이트 계속 진행합니다.");
      }
      
      // Supabase에 업데이트 데이터 저장
      const { error } = await supabase
        .from("exhibition")
        .update({
          name: selectedExhibition.name,
          contents: selectedExhibition.contents,
          photo: selectedExhibition.photo,
          start_date: startDate,
          end_date: endDate, // 반드시 포함
          working_hour: selectedExhibition.working_hour,
          off_date: selectedExhibition.off_date,
          add_info: selectedExhibition.add_info,
          homepage_url: selectedExhibition.homepage_url,
          isFree: selectedExhibition.isFree,
          isRecommended: selectedExhibition.isRecommended,
          naver_gallery_url: userInfo.url,
          price: selectedExhibition.price,
        })
        .eq("id", selectedExhibition.id);

      if (error) {
        console.error("Supabase 업데이트 에러:", error);
        throw error;
      }

      // 성공 메시지
      // alert('전시회 정보가 성공적으로 업데이트되었습니다.');
      addToast({
        title: "저장 완료료",
        description: "전시회 정보가 성공적으로 업데이트되었습니다.",
        color: "success",
      });

      // 데이터 새로고침
      loadExhibitions();
    } catch (error) {
      console.error("전시회 업데이트 중 오류 발생:", error);
      // alert('전시회 정보 업데이트 중 오류가 발생했습니다.');
      addToast({
        title: "저장 실패",
        description: "전시회 정보 업데이트 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedExhibition) return;
    onOpen();
  };

  // 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    try {
      // Supabase에서 전시회 삭제
      const { error } = await supabase
        .from("exhibition")
        .delete()
        .eq("id", selectedExhibition.id);

      if (error) throw error;

      // 상태 초기화
      setSelectedExhibition(null);
      setSelectedKey(new Set([]));

      // 데이터 새로고침
      loadExhibitions();

      addToast({
        title: "삭제 완료",
        description: "전시회가 성공적으로 삭제되었습니다.",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "삭제 실패",
        description: "전시회 삭제 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      onClose();
    }
  };

  // 검색어 변경 핸들러
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // selectedKey 변경 핸들러
  const handleKeyChange = (keys) => {
    setSelectedKey(keys);

    if (keys.size > 0) {
      const selectedId = Number(Array.from(keys)[0]);
      const exhibition = exhibitions.find((e) => e.id === selectedId);

      if (exhibition) {
        handleSelectExhibition(exhibition);
      }
    }
  };

  console.log('userInfo:',userInfo)
  console.log("selectedExhibition:",selectedExhibition)
  

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">전시 관리</h1>
        </div>

        {/* 검색 및 신규 등록 영역 */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <Input
            placeholder="전시회 검색..."
            value={searchTerm}
            onValueChange={handleSearchChange}
            startContent={
              <Icon icon="lucide:search" className="text-default-400" />
            }
            className="w-full md:w-1/3"
          />
          <Button
            onClick={handleNewExhibition}
            className="bg-primary text-white"
            disabled={isCreatingNew}
          >
            <Icon icon="lucide:plus" className="text-lg mr-1" />
            신규 전시 등록
          </Button>
        </div>

        {/* 전시회 목록 영역 */}
        <section className="rounded-lg ">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse border-spacing-0 min-w-[600px]">
              <thead className="bg-default-100">
                <tr>
                  <th className="p-3 text-left border-b ">제목</th>
                  <th className="p-3 text-left border-b ">추가 정보</th>
                  <th className="p-3 text-left border-b ">날짜</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : exhibitions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center">
                      전시회 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  exhibitions.map((exhibition) => (
                    <tr
                      key={exhibition.id}
                      className={`border-b cursor-pointer ${
                        selectedKey.has(exhibition.id.toString())
                          ? "bg-primary-100"
                          : ""
                      } `}
                      onClick={() => handleSelectExhibition(exhibition)}
                    >
                      <td className="p-3  ">{exhibition.contents}</td>
                      <td className="p-3">
                        <div className="line-clamp-1 overflow-hidden text-ellipsis">
                          {exhibition.add_info}
                        </div>
                      </td>
                      <td className="p-3 ">
                        {exhibition.start_date && exhibition.end_date 
                          ? formatDateRange(exhibition.start_date, exhibition.end_date)
                          : "날짜 미설정"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              initialPage={1}
              page={currentPage}
              onChange={handlePageChange}
            />
          </div>
        </section>

        {/* 전시회 상세 정보 영역 */}
        <section className="bg-content2 rounded-lg p-4">
          {isCreatingNew ? (
            <ExhibitionDetail
              galleryInfo={galleryInfo}
              isNew={true}
              onSave={handleSaveNew}
              onCancel={handleCancel}
              selectedKey={selectedKey}
            />
          ) : selectedExhibition ? (
            <div>
              <div className="flex justify-end space-x-2 mb-4">
                <Button
                  onClick={handleUpdate}
                  color="primary"
                  className="flex items-center"
                  isLoading={isLoading}
                >
                  <Icon icon="lucide:save" className="text-lg mr-1" />
                  저장
                </Button>
                <Button
                  onClick={handleDelete}
                  color="danger"
                  variant="light"
                  className="flex items-center"
                >
                  <Icon icon="lucide:trash" className="text-lg mr-1" />
                  삭제
                </Button>
              </div>

              {/* 직접 편집 가능한 폼 영역 */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      전시회명
                    </label>
                    <Input
                      value={selectedExhibition.contents || ""}
                      onChange={(e) =>
                        handleFieldChange("contents", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    이미지
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                      {selectedExhibition.photo ? (
                        <div className="relative w-full">
                          <img
                            src={selectedExhibition.photo}
                            alt={selectedExhibition.contents}
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            isIconOnly
                            color="danger"
                            variant="flat"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => handleFieldChange("photo", "")}
                          >
                            <Icon icon="lucide:x" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Icon icon="lucide:image" className="text-4xl text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">이미지 미리보기</p>
                        </>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="photo-upload">
                        <Button as="span" color="primary" variant="flat" size="sm" className="flex items-center">
                          <Icon icon="lucide:upload" className="mr-1" />
                          {selectedExhibition.photo ? '이미지 변경' : '이미지 업로드'}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      시작일
                    </label>
                    <Input
                      value={selectedExhibition.start_date || ""}
                      onChange={(e) =>
                        handleFieldChange("start_date", e.target.value)
                      }
                      className="w-full"
                      placeholder="YYYYmmdd 형식 (예: 20240531)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      종료일 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={selectedExhibition.end_date || ""}
                      onChange={(e) =>
                        handleFieldChange("end_date", e.target.value)
                      }
                      className="w-full"
                      placeholder="YYYYmmdd 형식 (예: 20240630)"
                      color={!selectedExhibition.end_date ? "danger" : "default"}
                      helperText={!selectedExhibition.end_date ? "종료일은 필수 입력 항목입니다" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      운영 시간
                    </label>
                    <Input
                      value={selectedExhibition.working_hour || ""}
                      onChange={(e) =>
                        handleFieldChange("working_hour", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      휴관일
                    </label>
                    <Input
                      value={selectedExhibition.off_date || ""}
                      onChange={(e) =>
                        handleFieldChange("off_date", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      무료 여부
                    </label>
                    <Switch
                      isSelected={selectedExhibition.isFree}
                      onValueChange={(value) =>
                        handleFieldChange("isFree", value)
                      }
                    />
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium mb-1">
                      추천 전시회
                    </label>
                    <Switch
                      isSelected={selectedExhibition.isRecommended}
                      onValueChange={(value) =>
                        handleFieldChange("isRecommended", value)
                      }
                    />
                  </div> */}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    추가 정보
                  </label>
                  <Textarea
                    value={selectedExhibition.add_info || ""}
                    onChange={(e) =>
                      handleFieldChange("add_info", e.target.value)
                    }
                    className="w-full"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    홈페이지 URL
                  </label>
                  <Input
                    value={selectedExhibition.homepage_url || ""}
                    onChange={(e) =>
                      handleFieldChange("homepage_url", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-medium mb-1">
                    네이버 갤러리 URL
                  </label>
                  <Input
                    value={selectedExhibition.naver_gallery_url || ""}
                    onChange={(e) =>
                      handleFieldChange("naver_gallery_url", e.target.value)
                    }
                    className="w-full"
                  />
                </div> */}

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">리뷰 수</label>
                    <Input
                      type="number"
                      value={selectedExhibition.review_count || 0}
                      onChange={(e) => handleFieldChange('review_count', parseInt(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">평균 별점</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={selectedExhibition.review_average || 0}
                      onChange={(e) => handleFieldChange('review_average', parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="text-center text-default-500 py-8">
              전시회를 선택하거나 신규 등록 버튼을 클릭하세요.
            </div>
          )}
        </section>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>전시회 삭제 확인</ModalHeader>
          <ModalBody>
            <p>정말로 이 전시회를 삭제하시겠습니까?</p>
            {selectedExhibition && (
              <p className="text-sm text-default-500 mt-2">
                {selectedExhibition.contents}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="flat" onPress={onClose}>
              취소
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
