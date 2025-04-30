"use client";

import React, { useState, useEffect } from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";

export function ExhibitionDetail({
  galleryInfo,
  exhibition = {},
  onUpdate,
  onDelete,
  isNew = false,
  onSave,
  onCancel,
  isReadOnly = false,
  isEdit = false,
  selectedKey,
}) {
  const emptyExhibition = {
    name: "",
    contents: "",
    photo: "",
    start_date: "",
    end_date: "",
    working_hour: "",
    off_date: "",
    add_info: "",
    homepage_url: "",
    isFree: false,
    isRecommended: false,
    review_count: 0,
    review_average: 0,
    naver_gallery_url: "",
    price: 0,
  };

  const [editedExhibition, setEditedExhibition] = useState(
    isNew ? emptyExhibition : exhibition
  );
  const [imagePreview, setImagePreview] = useState(
    isNew ? null : exhibition?.photo || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  // selectedKey나 exhibition이 변경될 때 필요한 데이터 로드
  useEffect(() => {
    if (exhibition && !isNew) {
      setEditedExhibition(exhibition);
      setImagePreview(exhibition.photo || null);
    }
  }, [selectedKey, exhibition, isNew]);

  // 저장 핸들러 - 내용이 변경되면 자동으로 저장
  const handleSave = async () => {
    // 필수 필드 검증
    if (!editedExhibition.contents) {
      addToast({
        title: "필수 입력 항목 오류",
        description: "갤러리명과 전시회명은 필수 입력 항목입니다.",
        color: "danger",
      });
      return;
    }
    if (!editedExhibition.end_date) {
      addToast({
        title: "종료일 오류",
        description: "종료일은 필수 입력 항목입니다.",
        color: "danger",
      });
      return;
    }
    if (!editedExhibition.start_date) {
      addToast({
        title: "시작일 오류",
        description: "시작일은 필수 입력 항목입니다.",
        color: "danger",
      });
      return;
    }

    // 날짜 형식 검증
    const validateDateFormat = (dateStr) => {
      if (!dateStr || dateStr.trim() === "") return true;
      return /^\d{8}$/.test(dateStr.trim());
    };

    
    if (!validateDateFormat(editedExhibition.start_date)) {
      addToast({
        title: "날짜 형식 오류",
        description: "시작일은 YYYYmmdd 형식으로 입력해주세요. (예: 20240101)",
        color: "danger",
      });
      return;
    }

    if (!validateDateFormat(editedExhibition.end_date)) {
      addToast({
        title: "날짜 형식 오류",
        description: "종료일은 YYYYmmdd 형식으로 입력해주세요. (예: 20240131)",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        // 신규 전시회 저장
        if (onSave) {
          onSave(editedExhibition);
        }
      } else {
        // 기존 전시회 업데이트
        if (onUpdate) {
          onUpdate(editedExhibition);
        }
      }
    } catch (error) {
      // console.error("전시회 저장 중 오류 발생:", error);
      addToast({
        title: "전시회 저장 중 오류 발생",
        description: "전시회 정보 저장 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
      addToast({
        title: "전시회 저장 완료",
        description: "전시회 정보가 성공적으로 저장되었습니다.",
        color: "success",
      });
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    if (isNew) {
      if (onCancel) onCancel();
    } else {
      setEditedExhibition(exhibition);
      setImagePreview(exhibition.photo || null);
      if (onCancel) onCancel();
    }
  };

  // 삭제 핸들러
  const handleDelete = () => {
    if (window.confirm("정말로 이 전시회를 삭제하시겠습니까?")) {
      if (onDelete) onDelete();
    }
  };

  // 필드 변경 핸들러
  const handleFieldChange = (field, value) => {
    const updatedExhibition = { ...editedExhibition, [field]: value };
    setEditedExhibition(updatedExhibition);
    // 여기서 변경사항 즉시 저장하지 않고, 사용자가 저장 버튼을 누를 때 저장하도록 변경
  };

  // 이미지 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        handleFieldChange("photo", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  console.log("editedExhibition", editedExhibition);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNew ? "신규 전시회 등록" : "전시회 정보"}
        </h2>
        {!isReadOnly && (
          <div className="flex gap-2">
            <Button color="primary" onPress={handleSave} isLoading={isSaving}>
              <Icon icon="lucide:save" className="text-lg mr-1" />
              {isNew ? "추가" : "저장"}
            </Button>
            {!isNew && (
              <Button color="danger" variant="flat" onPress={handleDelete}>
                <Icon icon="lucide:trash" className="mr-1" />
                삭제
              </Button>
            )}
            <Button color="default" variant="flat" onPress={handleCancel}>
              취소
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="갤러리명"
          value={galleryInfo?.name || ""}
          onValueChange={(value) => handleFieldChange("name", value)}
          isDisabled
        />

        <Input
          label="전시회명"
          value={editedExhibition.contents || ""}
          onValueChange={(value) => handleFieldChange("contents", value)}
          isReadOnly={isReadOnly}
        />

        <Input
          label="전시시작"
          value={editedExhibition.start_date || ""}
          onValueChange={(value) => {
            // 숫자만 입력 가능하도록 처리
            const numericValue = value.replace(/[^\d]/g, "").slice(0, 8);
            handleFieldChange("start_date", numericValue);
          }}
          isReadOnly={isReadOnly}
          placeholder="YYYYmmdd 형식으로 입력 (예: 20240101)"
          description="8자리 숫자로 입력 (YYYYMMDD)"
        />

        <Input
          label="전시종료"
          value={editedExhibition.end_date || ""}
          onValueChange={(value) => {
            // 숫자만 입력 가능하도록 처리
            const numericValue = value.replace(/[^\d]/g, "").slice(0, 8);
            handleFieldChange("end_date", numericValue);
          }}
          isReadOnly={isReadOnly}
          placeholder="YYYYmmdd 형식으로 입력 (예: 20240131)"
          description="8자리 숫자로 입력 (YYYYMMDD)"
        />

        <Input
          label="운영 시간"
          value={editedExhibition.working_hour || ""}
          onValueChange={(value) => handleFieldChange("working_hour", value)}
          isReadOnly={isReadOnly}
          placeholder="예: 10:00 - 18:00"
        />

        <Input
          label="휴관일"
          value={editedExhibition.off_date || ""}
          onValueChange={(value) => handleFieldChange("off_date", value)}
          isReadOnly={isReadOnly}
          placeholder="예: 매주 월요일"
        />

        <Input
          label="네이버 갤러리 URL"
          value={galleryInfo?.url || ""}
          onValueChange={(value) =>
            handleFieldChange("naver_gallery_url", value)
          }
          isReadOnly={isReadOnly}
          isDisabled
        />

        <Input
          label="홈페이지 URL"
          value={editedExhibition.homepage_url || ""}
          onValueChange={(value) => handleFieldChange("homepage_url", value)}
          isReadOnly={isReadOnly}
        />

        <Input
          type="number"
          label="가격 (원)"
          value={editedExhibition.price || 0}
          onValueChange={(value) => handleFieldChange("price", value)}
          isReadOnly={isReadOnly}
        />

        <div className="flex flex-col gap-2">
          <span className="text-small font-medium">옵션</span>
          <div className="flex flex-col gap-2">
            <Checkbox
              isSelected={editedExhibition.isFree || false}
              onValueChange={(value) => handleFieldChange("isFree", value)}
              isDisabled={isReadOnly}
            >
              무료 전시회
            </Checkbox>
            {/* <Checkbox
              isSelected={editedExhibition.isRecommended || false}
              onValueChange={(value) =>
                handleFieldChange("isRecommended", value)
              }
              isDisabled={isReadOnly}
            >
              추천 전시회 (메인 페이지 상단 노출)
            </Checkbox> */}
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-small font-medium">전시회 이미지</label>
            <Button 
              color="primary" 
              variant="flat" 
              size="sm"
              as="a" 
              href="/sample/guide.jpg"
              download
            >
              <Icon icon="lucide:info" />
              가이드 라인
            </Button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
            {imagePreview ? (
              <div className="relative w-full">
                <img
                  src={imagePreview}
                  alt="전시회 이미지"
                  className="w-full h-48 object-cover rounded-md"
                />
                {!isReadOnly && (
                  <Button
                    isIconOnly
                    color="danger"
                    variant="flat"
                    size="sm"
                    className="absolute top-2 right-2"
                    onPress={() => {
                      setImagePreview(null);
                      handleFieldChange("photo", "");
                    }}
                  >
                    <Icon icon="lucide:x" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Icon
                  icon="lucide:image"
                  className="text-4xl text-gray-400 mb-2"
                />
                <p className="text-sm text-gray-500">이미지 미리보기</p>
              </>
            )}
            {!isReadOnly && (
              <div className="mt-4">
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label htmlFor="photo-upload">
                  <Button as="span" color="primary" variant="flat" size="sm">
                    <Icon icon="lucide:upload" className="mr-1" />
                    이미지 {imagePreview ? "변경" : "업로드"}
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>

        <Textarea
          label="추가 정보"
          value={editedExhibition.add_info || ""}
          onValueChange={(value) => handleFieldChange("add_info", value)}
          isReadOnly={isReadOnly}
          className="md:col-span-2"
          placeholder="전시회에 대한 상세 정보를 입력하세요."
        />
      </div>

      {!isNew && (
        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-medium mb-2">리뷰 통계</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-default-100 p-4 rounded-lg">
              <p className="text-sm text-default-600">평균 평점</p>
              <p className="text-2xl font-bold">
                {(editedExhibition.review_average || 0).toFixed(1)}
                <span className="text-sm font-normal ml-1">/ 5.0</span>
              </p>
            </div>
            <div className="bg-default-100 p-4 rounded-lg">
              <p className="text-sm text-default-600">리뷰 수</p>
              <p className="text-2xl font-bold">
                {(editedExhibition.review_count || 0).toLocaleString()}개
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
