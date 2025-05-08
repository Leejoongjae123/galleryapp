'use client'
import React, { useState, useEffect } from "react";
import { Card, CardBody, Skeleton } from "@heroui/react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
export function ExhibitionCarousel() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const supabase = createClient();

  const getBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("banner").select("*").order("id", { ascending: false });
      if (error) {
        console.error("Error fetching banners:", error);
      }
      setBanners(data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    getBanners();
  }, []);

  // 자동 슬라이딩을 위한 타이머 설정
  useEffect(() => {
    let intervalId;
    
    if (!loading && banners.length > 0 && !isPaused) {
      intervalId = setInterval(() => {
        setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
      }, 2000); // 2초마다 슬라이드 변경
    }
    
    // 컴포넌트가 언마운트되거나 의존성이 변경될 때 타이머 정리
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loading, banners.length, isPaused]);

  const handleTouchStart = (e) => {
    setIsPaused(true); // 터치 시작할 때 자동 슬라이딩 일시 중지
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) { // 왼쪽으로 스와이프
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }

    if (touchStart - touchEnd < -75) { // 오른쪽으로 스와이프
      setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }
    
    // 터치 끝난 후 3초 후에 자동 슬라이딩 재개
    setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  // 마우스 오버 시 자동 슬라이딩 일시 중지
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  // 마우스 아웃 시 자동 슬라이딩 재개
  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className="relative py-5 w-full flex justify-center items-center"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="w-full" shadow="none">
        <CardBody className="p-0 w-full flex justify-center items-center">
          {loading ? (
            <Card className="w-[300px]  space-y-5 p-4" radius="lg" shadow="none" >
              <Skeleton className="rounded-lg">
                <div className="h-48 rounded-lg bg-default-300" />
              </Skeleton>
              <div className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                  <div className="h-3 w-3/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                  <div className="h-3 w-4/5 rounded-lg bg-default-200" />
                </Skeleton>
                <Skeleton className="w-2/5 rounded-lg">
                  <div className="h-3 w-2/5 rounded-lg bg-default-300" />
                </Skeleton>
              </div>
            </Card>
          ) : banners.length > 0 && (
            
              <Image
                src={banners[currentSlide]?.url || `https://picsum.photos/800/400?random=${currentSlide}`}
                alt={banners[currentSlide]?.title || `Slide ${currentSlide + 1}`}
                width={800}
                height={400}
                className="w-[90%] h-[200px] object-cover rounded-2xl"
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi9TUHAAAAABJRU5ErkJggg=="
              />
            
          )}
        </CardBody>
      </Card>
      {!loading && (
        <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                currentSlide === index ? 'bg-[#007AFF]' : 'bg-[#B8B8B8]'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}