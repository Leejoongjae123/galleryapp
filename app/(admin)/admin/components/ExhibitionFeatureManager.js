'use client'
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Checkbox,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Switch,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { v4 as uuidv4 } from 'uuid';
import {debounce} from 'lodash'
export default function ExhibitionFeatureManager() {
  // 상태 관리
  const [exhibitions, setExhibitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  
  const itemsPerPage = 5;

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 데이터 가져오기
  const fetchExhibitions = async () => {
    setIsLoading(true);
    try {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      // 한 번의 쿼리로 데이터와 전체 개수를 함께 가져옵니다
      let query = supabase
        .from('exhibition')
        .select('*', { count: 'exact' })
        .range(start, end)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('contents', `%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setExhibitions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.log('전시회 데이터를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어 변경 시
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색어 변경 시 첫 페이지로 이동
  };

  // debounce된 검색 함수
  const debouncedSearch = debounce(() => {
    fetchExhibitions();
  }, 500);

  // 데이터 초기 로드 및 검색어/페이지 변경 시 다시 로드
  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, currentPage]);

  // 페이지 변경 시
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 추천 상태 토글
  const toggleRecommended = async (id, currentState) => {
    const updatedExhibitions = exhibitions.map((exhibition) => 
      exhibition.id === id 
        ? { ...exhibition, isRecommended: !currentState } 
        : exhibition
    );
    setExhibitions(updatedExhibitions);
  };

  // 변경사항 저장
  const saveChanges = async () => {
    setIsLoading(true);
    try {
      // 추천 상태가 변경된 전시회들에 대해 업데이트
      for (const exhibition of exhibitions) {
        const { error } = await supabase
          .from('exhibition')
          .update({ isRecommended: exhibition.isRecommended })
          .eq('id', exhibition.id);
        
        if (error) throw error;
      }
      setSaveMessage("변경사항이 성공적으로 저장되었습니다.");
      onOpen();
    } catch (error) {
      console.error('변경사항 저장 중 오류 발생:', error);
      setSaveMessage("변경사항 저장 중 오류가 발생했습니다.");
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };

  // 상세 정보 보기
  const handleViewDetail = (exhibition) => {
    setSelectedExhibition(exhibition);
    onDetailOpen();
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (field, value) => {
    setSelectedExhibition({
      ...selectedExhibition,
      [field]: value
    });
  };

  // 전시회 정보 업데이트
  const handleUpdateExhibition = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exhibition')
        .update({
          name: selectedExhibition.name,
          contents: selectedExhibition.contents,
          photo: selectedExhibition.photo,
          date: selectedExhibition.date,
          working_hour: selectedExhibition.working_hour,
          off_date: selectedExhibition.off_date,
          add_info: selectedExhibition.add_info,
          homepage_url: selectedExhibition.homepage_url,
          isFree: selectedExhibition.isFree,
          isRecommended: selectedExhibition.isRecommended,
          review_count: selectedExhibition.review_count,
          review_average: selectedExhibition.review_average,
          naver_gallery_url: selectedExhibition.naver_gallery_url,
          price: selectedExhibition.price
        })
        .eq('id', selectedExhibition.id);

      if (error) throw error;

      setSaveMessage("전시회 정보가 성공적으로 업데이트되었습니다.");
      onOpen();
      fetchExhibitions();
    } catch (error) {
      console.error('전시회 업데이트 중 오류 발생:', error);
      setSaveMessage("전시회 정보 업데이트 중 오류가 발생했습니다.");
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 삭제 확인
  const handleDeleteConfirm = () => {
    if (!selectedExhibition) return;
    onDeleteOpen();
  };

  // 전시회 삭제 실행
  const handleDeleteExhibition = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exhibition')
        .delete()
        .eq('id', selectedExhibition.id);

      if (error) throw error;

      setSaveMessage("전시회가 성공적으로 삭제되었습니다.");
      onOpen();
      onDetailClose();
      onDeleteClose();
      setSelectedExhibition(null);
      fetchExhibitions();
    } catch (error) {
      console.log('전시회 삭제 중 오류 발생:', error);
      setSaveMessage("전시회 삭제 중 오류가 발생했습니다.");
      onOpen();
      onDeleteClose();
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 업로드 및 처리 핸들러
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage("파일 크기는 5MB 이하여야 합니다.");
        onOpen();
        return;
      }

      // 파일 형식 제한
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setSaveMessage("JPG, PNG, GIF, WEBP 형식의 이미지만 업로드할 수 있습니다.");
        onOpen();
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

      setSaveMessage("이미지가 성공적으로 업로드되었습니다.");
      onOpen();
      
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      setSaveMessage(`이미지 업로드 중 오류가 발생했습니다: ${error.message}`);
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      shadow="md"
      radius="lg"
      className="max-w-full col-span-2 md:col-span-1"
    >
      <CardHeader className="flex gap-3">
        <div className="flex flex-col">
          <p className="text-xl font-semibold">전시회 상단 노출 관리</p>
          <p className="text-small text-default-500">
            메인 페이지에 상단 노출할 전시회를 선택합니다
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="전시회 검색어를 입력하세요"
          radius="sm"
          className="mb-4"
          classNames={{
            input: "text-small",
            inputWrapper: "border-1",
          }}
        />

        <Table
          aria-label="전시회 목록"
          className="mb-4"
          shadow="none"
          classNames={{ wrapper: "p-0" }}
          isLoading={isLoading}
        >
          <TableHeader>
            <TableColumn className="w-1/10">노출</TableColumn>
            <TableColumn className="w-full">전시회명</TableColumn>
            {/* <TableColumn className="w-1/6">액션</TableColumn> */}
          </TableHeader>
          <TableBody>
            {exhibitions.map((exhibition) => (
              <TableRow key={exhibition.id} className="cursor-pointer">
                <TableCell>
                  <Checkbox
                    isSelected={exhibition.isRecommended}
                    onValueChange={() => toggleRecommended(exhibition.id, exhibition.isRecommended)}
                  />
                </TableCell>
                <TableCell onClick={() => handleViewDetail(exhibition)}>
                  {exhibition.contents}
                </TableCell>
                {/* <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    onPress={() => handleViewDetail(exhibition)}
                  >
                    상세보기
                  </Button>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(totalCount / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
          />
        </div>
      </CardBody>
      <CardFooter>
        <Button
          onPress={saveChanges}
          color="primary"
          radius="sm"
          className="w-full"
          isLoading={isLoading}
        >
          전시회 상단 노출 저장하기
        </Button>
      </CardFooter>
      
      {/* 저장 결과 알림 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>알림</ModalHeader>
          <ModalBody>
            {saveMessage}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onClose}>
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 전시회 상세 정보 모달 */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={onDetailClose}
        size="3xl"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <span>전시회 상세 정보</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                color="danger"
                variant="light"
                onPress={handleDeleteConfirm}
              >
                <Icon icon="lucide:trash" className="mr-1" />
                삭제
              </Button>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedExhibition && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">갤러리명</label>
                    <Input
                      value={selectedExhibition.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">전시회명</label>
                    <Input
                      value={selectedExhibition.contents || ''}
                      onChange={(e) => handleFieldChange('contents', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">이미지</label>
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
                            onPress={() => handleFieldChange('photo', '')}
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
                    <label className="text-sm font-semibold">날짜</label>
                    <Input
                      value={selectedExhibition.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">운영 시간</label>
                    <Input
                      value={selectedExhibition.working_hour || ''}
                      onChange={(e) => handleFieldChange('working_hour', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">휴관일</label>
                    <Input
                      value={selectedExhibition.off_date || ''}
                      onChange={(e) => handleFieldChange('off_date', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">가격</label>
                    <Input
                      type="number"
                      value={selectedExhibition.price || 0}
                      onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">무료 여부</label>
                    <Switch
                      isSelected={selectedExhibition.isFree}
                      onValueChange={(value) => handleFieldChange('isFree', value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">추천 전시회</label>
                    <Switch
                      isSelected={selectedExhibition.isRecommended}
                      onValueChange={(value) => handleFieldChange('isRecommended', value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">추가 정보</label>
                  <Textarea
                    value={selectedExhibition.add_info || ''}
                    onChange={(e) => handleFieldChange('add_info', e.target.value)}
                    className="w-full mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">홈페이지 URL</label>
                  <Input
                    value={selectedExhibition.homepage_url || ''}
                    onChange={(e) => handleFieldChange('homepage_url', e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">네이버 갤러리 URL</label>
                  <Input
                    value={selectedExhibition.naver_gallery_url || ''}
                    onChange={(e) => handleFieldChange('naver_gallery_url', e.target.value)}
                    className="w-full mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">리뷰 수</label>
                    <Input
                      type="number"
                      value={selectedExhibition.review_count || 0}
                      onChange={(e) => handleFieldChange('review_count', parseInt(e.target.value) || 0)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">평균 별점</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={selectedExhibition.review_average || 0}
                      onChange={(e) => handleFieldChange('review_average', parseFloat(e.target.value) || 0)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDetailClose}>
              취소
            </Button>
            <Button color="primary" onPress={handleUpdateExhibition} isLoading={isLoading}>
              저장
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent>
          <ModalHeader>전시회 삭제 확인</ModalHeader>
          <ModalBody>
            <p>정말로 이 전시회를 삭제하시겠습니까?</p>
            <p className="text-sm text-default-500 mt-2">
              {selectedExhibition?.contents}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              취소
            </Button>
            <Button color="danger" onPress={handleDeleteExhibition} isLoading={isLoading}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}
