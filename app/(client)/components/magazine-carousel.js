"use client";
import React from "react";
import {
  Card,
  CardBody,
  Tabs,
  Tab,
  Skeleton,
  Spinner,
  Link,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/navigation";
import Image from "next/image";
export function MagazineCarousel() {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState(null);
  const [touchEnd, setTouchEnd] = React.useState(null);
  const [magazines, setMagazines] = React.useState([]);
  const [selected, setSelected] = React.useState("michelin");
  const supabase = createClient();
  const router = useRouter();
  useEffect(() => {
    const fetchMagazines = async () => {
      const { data, error } = await supabase
        .from("magazine")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) {
        console.error("Error fetching magazines:", error);
      } else {
        setMagazines(data || []);
      }
    };

    fetchMagazines();
  }, []);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentSlide < magazines.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    }

    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-4 w-full justify-center items-center px-5 relative">
      <div onClick={() => router.push("/magazineList")} className="absolute top-7 right-4 flex items-center justify-center z-10">
        <div className="text-[12px] text-[#007AFF] font-bold hover:text-[#007AFF]">SEE ALL </div>
        <IoIosArrowForward className="text-[#007AFF] font-bold" />
      </div>
      <div className="flex w-full border-t border-gray-200 mb-2">
        <div className="flex w-full justify-center">
          <button
            className={`text-[12px] py-3 text-center font-medium ${
              selected === "michelin" 
                ? "border-t-4 border-black text-black relative" 
                : "text-gray-500"
            }`}
            onClick={() => setSelected("michelin")}
          >
            <span className={`${selected === "michelin" ? "relative" : ""}`}>
              미슐랭매거진
              
            </span>
          </button>
        </div>
      </div>
      {selected === "michelin" && (
        <div>
          {magazines.length > 0 ? (
            <div
              className="relative"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Card className="w-full">
                <CardBody className="p-0">
                  <Link href={`/magazine/${magazines[currentSlide].id}`}>
                    <Image
                      src={
                        magazines[currentSlide]?.photo[0]["url"] ||
                        `/images/noimage.jpg`
                      }
                      alt={magazines[currentSlide]?.title}
                      width={800}
                      height={454}
                      className="object-cover"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi9TUHAAAAABJRU5ErkJggg=="
                    />
                  </Link>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                    <h3 className="text-xl font-bold">
                      {magazines[currentSlide].title}
                    </h3>
                    <p>{magazines[currentSlide].subtitle || "매거진 내용"}</p>
                  </div>
                </CardBody>
              </Card>
              <div className="flex gap-2 justify-center mt-4">
                {magazines.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      currentSlide === index ? "bg-[#007AFF]" : "bg-[#B8B8B8]"
                    }`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-[300px]">
              <Skeleton className="w-full h-[300px]"></Skeleton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
