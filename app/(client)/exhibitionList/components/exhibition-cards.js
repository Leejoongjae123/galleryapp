"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider,addToast } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";

export function ExhibitionCards({ exhibitions, user, bookmarks, toggleBookmark, isBookmarked }) {
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
      <div className="flex flex-col items-center gap-4">
        <div className="grid gap-4 w-full justify-center items-center">
          {exhibitions.map((exhibition, index) => (
            <Card key={index} className="w-full ">
              <Link href={`/exhibition/${exhibition.id}`}>
                <CardBody className="flex gap-4 flex-row">
                  <img
                    src={exhibition.photo}
                    alt={exhibition.title}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex flex-col w-full">
                    <div className="flex flex-row justify-between items-start">
                      <div className="flex flex-col">
                        <div className="text-xs ">{exhibition.name}</div>
                        <div className="text-lg font-bold">
                          {exhibition.contents}
                        </div>
                      </div>
                      <div onClick={(e) => toggleBookmark(e, exhibition)}>
                        {isBookmarked(exhibition.id) ? (
                          <FaBookmark className="text-red-500 text-medium cursor-pointer" />
                        ) : (
                          <FaRegBookmark className="text-gray-500 text-medium cursor-pointer" />
                        )}
                      </div>
                    </div>

                    <Divider
                      orientation="horizontal"
                      className=" bg-gray-300"
                    />
                    <div className="text-xs flex flex-col my-2">
                      <div className="flex flex-row gap-1">
                        <FaRegCalendar />
                        {exhibition.date}
                      </div>
                      <div className="flex flex-row gap-1">
                        <IoMdPin />
                        {exhibition.gallery.address}
                      </div>
                      <div className="flex flex-row gap-1">
                        <FaRegStar />
                        {exhibition.review_average} ({exhibition.review_count})
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
