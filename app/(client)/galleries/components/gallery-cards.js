"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";

export function GalleryCards({ galleries, user, bookmarks, toggleBookmark, isBookmarked }) {
  console.log('galleries333', galleries)
  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        {galleries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 justify-center items-center w-full">
            {galleries.map((gallery, index) => (
              <Link href={`/galleries/${gallery.id}`} key={index} className="w-full">
                <Card shadow="sm" className="hover:cursor-pointer w-full">
                  <CardBody className="flex gap-4 flex-row w-full">
                    <img
                      src={gallery.thumbnail || `https://picsum.photos/200/200?random=${index}`}
                      alt={gallery.name || gallery.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex flex-col w-full">
                      <div className="flex flex-row justify-between items-start mb-2">
                        <div className="flex flex-col">
                          
                          <div className="text-[12px] font-bold">
                            {gallery.name || gallery.subtitle}
                          </div>
                        </div>
                        <div 
                          onClick={(e) => toggleBookmark(e, gallery)}
                          className="cursor-pointer"
                        >
                          {user && isBookmarked && isBookmarked(gallery.id) ? (
                            <FaBookmark className="text-red-500 text-lg bg-gray-500 rounded-full p-1 font-bold" />
                          ) : (
                            <FaRegBookmark className="text-white text-lg bg-gray-500 rounded-full p-1 font-bold" />
                          )}
                        </div>
                      </div>

                      <Divider
                        orientation="horizontal"
                        className=" bg-gray-300"
                      />
                      <div className="text-xs flex flex-col my-2">
                        <div className="flex flex-row gap-1 text-[10px]">
                          <img
                            src="/exhibition/미니지도.svg"
                            alt="미니지도"
                            className="w-4 h-4"
                          />
                          {gallery.address || gallery.location}
                        </div>
                        <div className="flex flex-row gap-1 text-[10px]">
                          <img
                            src="/exhibition/미니별점.png"
                            alt="미니별점"
                            className="w-4 h-4"
                          />
                          {gallery.visitor_rating || "1.0"}({gallery.blog_review_count || 0})
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
