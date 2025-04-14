"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider, addToast } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";

export function ExhibitionCards({
  exhibitions,
  user,
  bookmarks,
  toggleBookmark,
  isBookmarked,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const exhibitions = Array(5).fill({
  //   title: "수원 갤러리",
  //   subtitle: "김광석 초대전 전시회",
  //   date: "2024.03.15 - 2024.04.15",
  //   location: "서울 강남구",
  //   review: "4.0(225)",
  // });

  return (
    <>
      <div className="flex flex-col items-center gap-4 ">
        <div className="grid gap-4 w-full justify-center items-center">
          {exhibitions.map((exhibition, index) => (
            <Card classNames={{body: 'px-2 py-1'}} key={index} className="w-full " shadow="sm">
              <Link href={`/exhibition/${exhibition.id}`}>
                <CardBody className="grid grid-cols-7 items-center justify-center gap-x-3">
                  <div className="col-span-2">
                    <img
                      src={exhibition.photo || "/images/noimage.jpg"}
                      alt={exhibition.title}
                      className="w-20 h-20 object-cover rounded"
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
                    <div className="text-xs flex flex-col mt-2">
                      <div className="flex flex-row gap-1 text-[10px]">
                        <img
                          src="/exhibition/미니달력.svg"
                          alt="미니달력"
                          className="w-4 h-4"
                        />
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
                      <div className="flex flex-row gap-1 text-[10px]">
                        <img
                          src="/exhibition/미니가격.png"
                          alt="미니가격"
                          className="w-4 h-4"
                        />
                        {exhibition.price
                          ?.toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                        원
                      </div>
                      <div className="flex flex-row gap-1 text-[10px]">
                        <img
                          src="/exhibition/미니별점.png"
                          alt="미니별점"
                          className="w-4 h-4"
                        />
                        {exhibition.review_average?.toFixed(1) || "0.0"} (
                        {exhibition.review_count || 0})
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
