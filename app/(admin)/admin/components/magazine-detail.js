"use client";

import React from "react";
import { Input, Button, Textarea, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';

export function MagazineDetail({
  magazine,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedMagazine,
  setSelectedMagazine,
  onDelete,
  
}) {
  // 매거진 ID가 없으면 신규 등록 모드로 간주
  const isNewMagazine = !magazine.id;
  const [isEditing, setIsEditing] = React.useState(isNewMagazine);
  const [editedMagazine, setEditedMagazine] = React.useState({
    ...magazine,
    subtitle: magazine.subtitle || "",
    photos: magazine.photos || magazine.photo || [{ url: "" }],
    contents: magazine.contents || "",
  });
  const [imageUploading, setImageUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  // 이전 매거진 ID를 저장하는 ref
  const prevMagazineIdRef = React.useRef(null);
  const supabase = createClient();

  useEffect(() => {
    // magazine 객체가 변경되면 항상 데이터 업데이트
    setEditedMagazine({
      ...magazine,
      subtitle: magazine.subtitle || "",
      // photo와 photos 모두 확인하여 처리 (데이터베이스에는 photo로 저장되므로)
      photos: magazine.photos || magazine.photo || [{ url: "" }],
      contents: magazine.contents || "",
    });

    // 새 매거진이거나 기존 매거진이든 항상 편집 모드로 설정
    setIsEditing(true);

    // 이전 매거진 ID 업데이트
    prevMagazineIdRef.current = magazine.id;
  }, [magazine]);

  const uploadImageToSupabase = async (file) => {
    try {
      setImageUploading(true);
      setUploadProgress(0);
      
      // 파일 이름은 고유하게 생성 (UUID + 원본 파일명)
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `magazine/${fileName}`;
      
      // Supabase storage에 이미지 업로드
      const { data, error } = await supabase.storage
        .from('magazine')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (error) {
        throw error;
      }

      // 업로드된 이미지의 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('magazine')
        .getPublicUrl(filePath);

      setImageUploading(false);
      return publicUrlData.publicUrl;
    } catch (error) {
      setImageUploading(false);
      console.error('이미지 업로드 중 오류 발생:', error);
      addToast({
        title: '업로드 오류',
        description: '이미지 업로드 중 오류가 발생했습니다: ' + error.message,
        type: 'error',
      });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      // 필수 입력값 검증
      if (!editedMagazine.title.trim()) {
        addToast({
          title: "입력 오류",
          description: "제목은 필수 입력 항목입니다.",
          type: "error",
        });
        return;
      }

      // 빈 URL을 가진 이미지 항목 제거
      const filteredPhotos = editedMagazine.photos.filter(photo => photo.url.trim() !== "");
      
      // 새 매거진 등록
      if (isNewMagazine) {
        console.log("신규 등록하기");
        const { data, error } = await supabase.from("magazine").insert([
          {
            title: editedMagazine.title,
            subtitle: editedMagazine.subtitle || "",
            contents: editedMagazine.contents || "",
            photo: filteredPhotos.length > 0 ? filteredPhotos : null,
          },
        ]).select();

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // 성공적으로 등록된 데이터로 UI 업데이트
          onUpdate(data[0]);
          addToast({
            title: "등록 완료",
            description: "새 매거진이 등록되었습니다.",
            color: "success",
          });
          setSelectedMagazine(null);
        }
      } else {
        // 기존 매거진 데이터 업데이트
        console.log("업데이트하기");
        const { error } = await supabase
          .from("magazine")
          .update({
            title: editedMagazine.title,
            subtitle: editedMagazine.subtitle || "",
            contents: editedMagazine.contents,
            photo: filteredPhotos.length > 0 ? filteredPhotos : null,
          })
          .eq("id", editedMagazine.id);

        if (error) {
          throw error;
        }

        onUpdate({
          ...editedMagazine,
          photos: filteredPhotos.length > 0 ? filteredPhotos : null,
          thumbnail: filteredPhotos.length > 0 ? filteredPhotos[0].url : "",
        });
        addToast({
          title: "업데이트 완료",
          description: "매거진 정보가 업데이트되었습니다.",
          color: "success",
        });
        setSelectedMagazine(null);
      }

      // 저장 후 편집 모드 종료
      setIsEditing(false);
      
      // 목록 새로고침 실행
      try {
        if (onRefresh) {
          console.log("매거진 목록 새로고침 함수 호출 시도");
          onRefresh();
          console.log("매거진 목록 새로고침 함수 호출 성공");
        } else {
          console.log("매거진 목록 새로고침 함수가 전달되지 않았습니다");
        }
      } catch (refreshError) {
        console.error("매거진 목록 새로고침 중 오류 발생:", refreshError);
      }
    } catch (error) {
      console.error("매거진 저장 중 오류 발생:", error);
      addToast({
        title: "저장 오류",
        description: "매거진 저장 중 오류가 발생했습니다: " + error.message,
        color: "danger",
      });
    }
  };

  const handleDelete = async () => {


    try {
      const { error } = await supabase
        .from("magazine")
        .delete()
        .eq("id", magazine.id);

      if (error) {
        throw error;
      }

      addToast({
        title: "삭제 완료",
        description: "매거진이 삭제되었습니다.",
        color: "success",
      });

      // 상태 초기화 및 목록 새로고침
      onDelete();
      
    } catch (error) {
      console.error("매거진 삭제 중 오류 발생:", error);
      addToast({
        title: "삭제 오류",
        description: "매거진 삭제 중 오류가 발생했습니다: " + error.message,
        type: "error",
      });
    }
  };

  const handleCancel = () => {
    if (isNewMagazine) {
      // 신규 등록 취소 시 목록으로 돌아가기
      onDelete();
    } else {
      // 기존 매거진 수정 취소 시 선택 해제하고 목록으로 돌아가기
      setEditedMagazine({
        ...magazine,
        subtitle: magazine.subtitle || "",
        photos: magazine.photos || magazine.photo || [{ url: "" }],
        contents: magazine.contents || "",
      });
      
      // 선택된 매거진 초기화
      if (typeof setSelectedMagazine === 'function') {
        setSelectedMagazine(null);
      }
      
      // 선택된 키 초기화
      if (typeof setSelectedKeys === 'function') {
        setSelectedKeys(new Set([]));
      }
    }
  };

  const handleImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await uploadImageToSupabase(file);
      if (imageUrl) {
        const updatedPhotos = [...editedMagazine.photos];
        updatedPhotos[index] = { url: imageUrl };
        setEditedMagazine({
          ...editedMagazine,
          photos: updatedPhotos,
        });
      }
    }
  };

  const addImageField = () => {
    setEditedMagazine({
      ...editedMagazine,
      photos: [...editedMagazine.photos, { url: "" }],
    });
  };

  const removeImageField = (index) => {
    if (editedMagazine.photos.length <= 1) {
      setEditedMagazine({
        ...editedMagazine,
        photos: [{ url: "" }],
      });
    } else {
      const updatedPhotos = editedMagazine.photos.filter((_, i) => i !== index);
      setEditedMagazine({
        ...editedMagazine,
        photos: updatedPhotos,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {isNewMagazine ? "새 매거진 등록" : "매거진 상세 정보"}
        </h2>
        <div className="flex gap-2">
          <Button color="primary" onPress={handleSave}>
            <Icon icon="lucide:save" className="text-lg mr-1" />
            {isNewMagazine ? "등록" : "저장"}
          </Button>
          {!isNewMagazine && (
            <Button color="danger" variant="solid" onPress={handleDelete}>
              <Icon icon="lucide:trash" className="text-lg mr-1" />
              삭제
            </Button>
          )}

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="제목"
          value={editedMagazine.title || ''}
          onValueChange={(value) => setEditedMagazine({...editedMagazine, title: value})}
          className="md:col-span-2"
        />

        <Input
          label="부제목"
          value={editedMagazine.subtitle || ''}
          onValueChange={(value) => setEditedMagazine({...editedMagazine, subtitle: value})}
          className="md:col-span-2"
        />

        <div className="space-y-2 md:col-span-2">

          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 대표 섬네일 (세로형) */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <h3 className="text-center font-medium mb-2">대표 이미지</h3>
              <div className="relative w-full">
                {editedMagazine.photos && editedMagazine.photos.length > 0 && editedMagazine.photos[0].url ? (
                  <div className="relative">
                    <img 
                      src={editedMagazine.photos[0].url} 
                      alt="대표 썸네일" 
                      className="w-full h-64 object-cover rounded-md mx-auto"
                    />
                    {isEditing && (
                      <Button
                        isIconOnly
                        color="danger"
                        variant="flat"
                        size="sm"
                        className="absolute top-2 right-2"
                        onPress={() => removeImageField(0)}
                      >
                        <Icon icon="lucide:x" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isEditing && (
                      <input
                        type="file"
                        id="thumbnail-upload"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 0)}
                        className="hidden"
                        disabled={imageUploading}
                      />
                    )}
                    <label 
                      htmlFor={isEditing ? "thumbnail-upload" : ''}
                      className={`${isEditing ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                        <Icon icon="lucide:image" className="text-4xl text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">대표 이미지를 업로드해주세요</p>
                        {isEditing && imageUploading && (
                          <p className="text-xs text-blue-500 mt-2">업로드 중...</p>
                        )}
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>
            
            {/* 추가 이미지 갤러리 (가로형) */}
            <div className="md:col-span-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
              <h3 className="text-center font-medium mb-2">추가 이미지</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {editedMagazine.photos.slice(1).map((photo, index) => (
                  <div key={index + 1} className="relative">
                    {photo.url ? (
                      <div className="group relative">
                        <img 
                          src={photo.url} 
                          alt={`매거진 이미지 ${index + 1}`} 
                          className="w-full h-28 object-cover rounded-md cursor-pointer"
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                          <Icon icon="lucide:eye" className="text-white text-xl" />
                        </div>
                        {isEditing && (
                          <Button
                            isIconOnly
                            color="danger"
                            variant="flat"
                            size="sm"
                            className="absolute top-1 right-1"
                            onPress={() => removeImageField(index + 1)}
                          >
                            <Icon icon="lucide:x" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <>
                        {isEditing && (
                          <input
                            type="file"
                            id={`photo-upload-${index + 1}`}
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, index + 1)}
                            className="hidden"
                            disabled={imageUploading}
                          />
                        )}
                        <label 
                          htmlFor={isEditing ? `photo-upload-${index + 1}` : ''}
                          className="cursor-pointer w-full h-full"
                        >
                          <div className="flex flex-col items-center justify-center h-28 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
                            <Icon icon="lucide:image" className="text-2xl text-gray-400" />
                            <span className="text-xs text-gray-500 mt-1">이미지 없음</span>
                            {isEditing && imageUploading && (
                              <span className="text-xs text-blue-500 mt-1">업로드 중...</span>
                            )}
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                ))}

                {/* 이미지 추가 버튼 */}
                {isEditing && (
                  <div className="flex items-center justify-center h-28 bg-gray-100 rounded-md cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors" onClick={addImageField}>
                    <div className="flex flex-col items-center justify-center">
                      <Icon icon="lucide:plus-circle" className="text-3xl text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1">이미지 추가</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {imageUploading && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center mt-1">{uploadProgress}% 업로드 중</p>
            </div>
          )}
        </div>

        <Textarea
          label="내용"
          value={editedMagazine.contents || ''}
          onValueChange={(value) => setEditedMagazine({...editedMagazine, contents: value})}
          className="md:col-span-2"
          minRows={5}
        />
      </div>
    </div>
  );
} 