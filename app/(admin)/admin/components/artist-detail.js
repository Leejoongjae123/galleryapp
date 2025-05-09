"use client";
import React from "react";
import { Input, Button, Textarea, Checkbox, addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { QRCodeSVG } from "qrcode.react";

export function ArtistDetail({
  artist,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedArtist,
  setSelectedArtist,
}) {
  const [isEditing, setIsEditing] = React.useState(true); // 항상 편집 모드로 설정
  const [editedArtist, setEditedArtist] = React.useState(artist);
  const prevArtistIdRef = React.useRef(artist.id);
  const supabase = createClient();
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // QR 코드 관련 상태
  const [qrValue, setQrValue] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const qrRef = useRef(null);
  
  useEffect(() => {
    // 작가 데이터 받아오면 상태 업데이트
    setEditedArtist(artist);
    setPreviewUrl(artist.avatar_url || '');
    console.log("ArtistDetail: 작가 정보 수신", artist);

    // 항상 편집 모드로 설정
    setIsEditing(true);

    // 이전 작가 ID 업데이트
    prevArtistIdRef.current = artist.id;
    
    // QR 코드 URL 설정
    if (artist.id) {
      // 현재 window.location.origin 가져오기
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setBaseUrl(origin);
      setQrValue(`${origin}/artist/${artist.id}`);
    }
  }, [artist]);

  // selectedKeys가 변경될 때 해당 작가 정보 가져오기
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!selectedKeys || selectedKeys.size === 0) {
        return;
      }
      
      try {
        console.log("작가 데이터 로드 시도:", Array.from(selectedKeys)[0]);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", Array.from(selectedKeys)[0])
          .single();
          
        if (error) throw error;
        
        if (data) {
          console.log("작가 데이터 로드 성공:", data);
          setEditedArtist(data);
          setPreviewUrl(data.avatar_url || '');
          
          // 부모 컴포넌트의 selectedArtist 업데이트
          if (setSelectedArtist) {
            setSelectedArtist(data);
          }
        }
      } catch (error) {
        console.error("작가 데이터 로드 오류:", error);
        addToast({
          title: "작가 정보 로드 오류",
          description: error.message,
          color: "danger",
        });
      }
    };
    
    fetchArtistData();
  }, [selectedKeys, setSelectedArtist]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 파일 유형 체크
    if (!file.type.includes("image")) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 파일만 업로드할 수 있습니다.",
        color: "danger",
      });
      return;
    }
    
    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 크기는 5MB 이하여야 합니다.",
        color: "danger",
      });
      return;
    }
    
    setImageFile(file);
    
    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      setIsUploading(true);
      
      // 고유한 파일명 생성
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `artist/${fileName}`;
      
      // Supabase Storage에 파일 업로드
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      addToast({
        title: "이미지 업로드 오류",
        description: error.message,
        color: "danger",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      console.log('저장 시작');
      
      if (!editedArtist.id) {
        throw new Error("작가 ID가 없습니다.");
      }
      
      // 이미지 파일이 있으면 먼저 업로드
      let avatar_url = editedArtist.avatar_url;
      if (imageFile) {
        console.log("이미지 업로드 시작");
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          avatar_url = uploadedUrl;
          console.log("이미지 업로드 완료:", avatar_url);
        }
      }
      
      // 업데이트할 데이터 준비
      const updateData = {
        isArtist: true,
        artist_name: editedArtist.artist_name || "",
        artist_phone: editedArtist.artist_phone || "",
        artist_intro: editedArtist.artist_intro || "",
        artist_birth: editedArtist.artist_birth || "",
        artist_genre: editedArtist.artist_genre || "",
        artist_proof: editedArtist.artist_proof || "",
        artist_credit: editedArtist.artist_credit || 0,
        isArtistApproval: editedArtist.isArtistApproval || false,
        avatar_url: avatar_url || "", // 업로드된 이미지 URL 추가
      };
      
      console.log('업데이트 데이터:', updateData);
      console.log('업데이트할 작가 ID:', editedArtist.id);
      
      // 작가 정보 직접 업데이트 (prefer 헤더 추가)
      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", editedArtist.id)
        .select()
      
      if (error) {
        console.error("업데이트 오류:", error);
        throw error;
      }
      
      console.log('업데이트 결과:', data);
      
      if (data && data.length > 0) {
        // 성공적으로 업데이트된 경우
        const updatedArtist = data[0];
        console.log("업데이트된 데이터:", updatedArtist);
        setEditedArtist(updatedArtist);
        
        // 필요한 경우 부모 컴포넌트 함수 호출
        if (onUpdate) onUpdate(updatedArtist);
        if (setSelectedArtist) setSelectedArtist(updatedArtist);
        
        // 리프레시 토글 업데이트 (목록 새로고침을 위함)
        if (setRefreshToggle) {
          setRefreshToggle(!refreshToggle);
        }
        
        addToast({
          title: "작가 정보 업데이트 완료",
          description: "작가 정보가 성공적으로 업데이트되었습니다.",
          color: "success",
        });
      } else {
        console.log("업데이트 성공했으나 데이터가 반환되지 않음");
        
        // 업데이트된 데이터를 다시 가져오기
        const { data: refreshedData, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", editedArtist.id)
          .single();
          
        if (fetchError) {
          console.error("데이터 새로고침 오류:", fetchError);
        } else if (refreshedData) {
          console.log("새로고침된 데이터:", refreshedData);
          setEditedArtist(refreshedData);
          
          if (onUpdate) onUpdate(refreshedData);
          if (setSelectedArtist) setSelectedArtist(refreshedData);
          
          // 리프레시 토글 업데이트
          if (setRefreshToggle) {
            setRefreshToggle(!refreshToggle);
          }
          
          addToast({
            title: "작가 정보 업데이트 완료",
            description: "작가 정보가 성공적으로 업데이트되었습니다.",
            color: "success",
          });
        }
      }
    } catch (error) {
      console.error("작가 정보 저장 중 오류:", error);
      addToast({
        title: "작가 정보 저장 오류",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    // 변경 사항 디버깅 로그
    console.log(`입력 필드 변경: ${name} = ${newValue}`);
    
    setEditedArtist((prev) => {
      const updated = { ...prev, [name]: newValue };
      console.log('업데이트된 작가 데이터:', updated);
      return updated;
    });
  };

  const handleCancel = () => {
    // 취소 시 항상 작가 선택 초기화
    setSelectedArtist(null);
    setSelectedKeys(new Set([]));
    setEditedArtist(artist);
    setPreviewUrl(artist.avatar_url || '');
    setImageFile(null);
  };

  // 이미지 삭제 함수
  const handleRemoveImage = () => {
    setPreviewUrl("");
    setImageFile(null);
    setEditedArtist((prev) => ({ ...prev, avatar_url: "" }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
 


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          작가 상세 정보
        </h2>
        <div className="flex gap-2">
          <Button color="primary" onPress={handleSave} isDisabled={isUploading}>
            <Icon icon="lucide:save" className="text-lg mr-1" />
            저장
            
          </Button>
          <Button variant="flat" onPress={handleCancel} isDisabled={isUploading}>
            <Icon icon="lucide:x" className="text-lg mr-1" />
            취소
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">

        

        <Input
          className="col-span-2 md:col-span-1"
          label="작가 이름"
          name="artist_name"
          value={editedArtist.artist_name || ""}
          onChange={handleInputChange}
          // isRequired={true}
          isDisabled={true}
        />

        <Input
          label="전화번호"
          name="artist_phone"
          value={editedArtist.artist_phone || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <Input
          label="생년월일"
          name="artist_birth"
          placeholder="YYYY-MM-DD"
          value={editedArtist.artist_birth || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <Input
          label="장르"
          name="artist_genre"
          value={editedArtist.artist_genre || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <Input
          label="작가 소개"
          name="artist_intro"
          value={editedArtist.artist_intro || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <Input
          label="인증 자료"
          name="artist_proof"
          value={editedArtist.artist_proof || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <Input
          label="등록 크레딧"
          name="artist_credit"
          value={editedArtist.artist_credit || ""}
          onChange={handleInputChange}
          className="col-span-2 md:col-span-1"
        />

        <div className="flex flex-col gap-4 md:col-span-2 mt-2">
          <h3 className="text-md font-medium">작가 옵션</h3>
          <div className="flex flex-col gap-3 pl-1">
            <Checkbox
              id="isArtistApproval"
              isSelected={editedArtist.isArtistApproval || false}
              onChange={(e) => setEditedArtist((prev) => ({ ...prev, isArtistApproval: e.target.checked }))}
            >
              작가 인증 승인
            </Checkbox>
          </div>
        </div>

        
      </div>
    </div>
  );
} 