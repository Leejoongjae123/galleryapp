"use client";
import React, { useState, memo, useCallback } from "react";
import { Card, CardBody, Divider, addToast } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { FaPlusCircle } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { IoCalendarClear } from "react-icons/io5";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
// 개별 전시회 카드 컴포넌트를 메모이제이션
const ExhibitionCard = memo(({ exhibition, toggleBookmark, isBookmarked }) => {
  return (
    <Card classNames={{body: 'px-2 py-1'}} className="w-full" shadow="sm">
      <Link href={`/exhibition/${exhibition.id}`}>
        <CardBody className="grid grid-cols-7 items-center justify-center gap-x-3">
          <div className="col-span-2">
            <Image
              src={exhibition.photo || "/images/noimage.jpg"}
              alt="main image"
              width={80}
              height={80}
              className="object-cover rounded"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi9TUHAAAAABJRU5ErkJggg=="
            />
          </div>

          <div className="flex flex-col col-span-5">
            <div className="flex flex-row justify-between items-start">
              <div className="flex flex-col">
                <div className="text-[10px]">{exhibition.name||'없음'}</div>
                <div className="text-[12px] font-bold">
                  {exhibition.contents}
                </div>
              </div>
              <div onClick={(e) => toggleBookmark(e, exhibition)}>
                {isBookmarked(exhibition.id) ? (
                  <FaBookmark className="text-red-500 text-lg bg-gray-300 rounded-full p-1 cursor-pointer font-bold" />
                ) : (
                  <FaRegBookmark className="text-white font-bold text-lg bg-gray-300 rounded-full p-1 cursor-pointer" />
                )}
              </div>
            </div>

            <Divider
              orientation="horizontal"
              className=" bg-gray-300"
            />
            
            <div className="flex flex-row gap-1 text-[10px] items-center">
              <IoCalendarClear className="text-[#007AFF]" />
              {exhibition.start_date?.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1년$2월$3일"
              )}{" "}
              ~{" "}
              {exhibition.end_date?.replace(
                /(\d{4})(\d{2})(\d{2})/,
                "$1년$2월$3일"
              )}
            </div>
            <div className="flex flex-row gap-1 text-[10px] items-center">
              <FaMoneyBillWaveAlt className="text-[#007AFF]" />
              {exhibition.price
                ?.toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
              원
            </div>
            <div className="flex flex-row gap-1 text-[10px] items-center">
            <FaStar className="text-[#007AFF]" />

              {exhibition.review_average === 0 ? "1.0" : exhibition.review_average?.toFixed(1) || "1.0"} (
              {exhibition.review_count || 0})
            </div>
          </div>
        </CardBody>
      </Link>
    </Card>
  );
});

ExhibitionCard.displayName = 'ExhibitionCard';

// 메인 컴포넌트를 메모이제이션으로 최적화
export const ExhibitionCards = memo(function ExhibitionCards({
  exhibitions,
  user,
  bookmarks,
  toggleBookmark,
  isBookmarked,
}) {
  // 기존 상태 없애고 필요한 경우에만 추가
  if (!exhibitions || exhibitions.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">표시할 전시회가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {exhibitions.map((exhibition, index) => (
        <ExhibitionCard 
          key={index}
          exhibition={exhibition}
          toggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
        />
      ))}
    </div>
  );
});
