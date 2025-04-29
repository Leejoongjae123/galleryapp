"use client";
import React from "react";
import { Button, Skeleton, Input, Textarea, DatePicker, Spinner } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider, Image, CardFooter } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { parseDate } from "@internationalized/date";
import { CiImageOn } from "react-icons/ci";

export default function MagazineList() {
  const [magazines, setMagazines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [allLoaded, setAllLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState("/noimage.jpg");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const router = useRouter();
  const supabase = createClient();
  const [topCards, setTopCards] = useState([]);
  const [visibleTopCards, setVisibleTopCards] = useState([]);

  const genres = [
    { id: 1, name: "현대미술" },
    { id: 2, name: "명화/동양화" },
    { id: 3, name: "추상화" },
    { id: 4, name: "사진/일러스트" },
    { id: 5, name: "기타" }
  ];

  // 더미 데이터 - 20개의 탑 카드 아이템
  const dummyTopCards = [
    { id: 1, name: "김작가", photo: "/noimage.jpg" },
    { id: 2, name: "이작가", photo: "/noimage.jpg" },
    { id: 3, name: "박작가", photo: "/noimage.jpg" },
    { id: 4, name: "최작가", photo: "/noimage.jpg" },
    { id: 5, name: "정작가", photo: "/noimage.jpg" },
    { id: 6, name: "강작가", photo: "/noimage.jpg" },
    { id: 7, name: "조작가", photo: "/noimage.jpg" },
    { id: 8, name: "윤작가", photo: "/noimage.jpg" },
    { id: 9, name: "장작가", photo: "/noimage.jpg" },
    { id: 10, name: "임작가", photo: "/noimage.jpg" },
    { id: 11, name: "한작가", photo: "/noimage.jpg" },
    { id: 12, name: "오작가", photo: "/noimage.jpg" },
    { id: 13, name: "서작가", photo: "/noimage.jpg" },
    { id: 14, name: "신작가", photo: "/noimage.jpg" },
    { id: 15, name: "권작가", photo: "/noimage.jpg" },
    { id: 16, name: "황작가", photo: "/noimage.jpg" },
    { id: 17, name: "안작가", photo: "/noimage.jpg" },
    { id: 18, name: "송작가", photo: "/noimage.jpg" },
    { id: 19, name: "전작가", photo: "/noimage.jpg" },
    { id: 20, name: "홍작가", photo: "/noimage.jpg" },
  ];

  useEffect(() => {
    setTopCards(dummyTopCards);
    setVisibleTopCards(dummyTopCards.slice(0, visibleCount));
    setAllLoaded(dummyTopCards.length <= visibleCount);
  }, [visibleCount]);

  const getMagazines = async () => {
    const { data, error } = await supabase
      .from("magazine")
      .select("*")
      .order("created_at", { ascending: false });
    setMagazines(data);
    setAllLoaded(data.length <= visibleCount);
    setIsLoading(false);
  };

  useEffect(() => {
    getMagazines();
  }, []);

  console.log("magazines:", magazines);

  const loadMore = () => {
    const newVisibleCount = visibleCount + 12;
    setVisibleCount(newVisibleCount);
  };

  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);

      // 파일 확장자 추출
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Supabase Storage에 이미지 업로드
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // 업로드된 이미지의 public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 이미지 URL 상태 업데이트
      setProfileImage(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mx-2">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="max-w-[300px] w-full flex items-center gap-3"
            >
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="bg-white flex items-center w-[90%] justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <h2 className="text-lg font-bold text-center flex-grow">
              신규작가 등록하기
            </h2>
            <div className="w-10"></div>
          </div>
          <div className="w-[90%] flex flex-col gap-y-4 mt-6">
            <div className="flex flex-col items-center gap-y-2">
              <div className="relative w-24 h-24">
                <img
                  src={profileImage}
                  alt="프로필 이미지"
                  className={`w-full h-full object-cover rounded-full ${isUploading ? 'opacity-50' : ''}`}
                />
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                    <CiImageOn className="text-xl text-gray-600" />
                  </div>
                )}
              </div>
              <span className="text-sm text-gray-500">프로필 이미지</span>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">작가명</label>
              <Input
                type="text"
                variant="bordered"
                placeholder="작가명을 입력해주세요"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">연락처</label>
              <Input
                type="tel"
                variant="bordered"
                placeholder="연락처를 입력해주세요"
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">작가 소개</label>
              <Textarea
                variant="bordered"
                placeholder="작가 소개를 입력해주세요"
                minRows={4}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">출생연도</label>
              <DatePicker
                variant="bordered"
                placeholder="출생연도를 선택해주세요"
                showMonthAndYearPickers
                minValue={parseDate("1900-01-01")}
                maxValue={parseDate(new Date().toISOString().split('T')[0])}
                defaultValue={parseDate("1990-01-01")}
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">장르</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setSelectedGenre(genre.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${selectedGenre === genre.id 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm text-[#747474] font-medium">활동 검증 자료</label>
              <Textarea
                variant="bordered"
                placeholder="전시 이력, 수상 경력 등 작가 활동을 증명할 수 있는 자료를 입력해주세요"
                minRows={4}
              />
            </div>

            <Button
              color="primary"
              className="w-full mt-6 mb-24 bg-black text-white"
              size="lg"
            >
              신규 작가 등록하기
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
