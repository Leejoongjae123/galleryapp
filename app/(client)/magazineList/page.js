"use client";
import React from "react";
import { Button, Skeleton } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider, Image } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
export default function MagazineList() {
  const [magazines, setMagazines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [allLoaded, setAllLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

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
    const newVisibleCount = visibleCount + 5;
    setVisibleCount(newVisibleCount);
    setAllLoaded(magazines.length <= newVisibleCount);
  };

  return (
    <div className="flex flex-col items-center justify-center ">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="max-w-[300px] w-full flex items-center gap-3">
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
            <h2 className="text-lg font-bold text-center flex-grow">매거진</h2>
            <div className="w-10"></div>
          </div>
          <div className="w-full flex flex-col gap-4 justify-center items-center">
            {magazines.slice(0, visibleCount).map((item, index) => (
              <React.Fragment key={item.id}>
                <div className="w-[90%] hover:cursor-pointer" onClick={() => router.push(`/magazine/${item.id}`)}>
                  <div
                    className="w-full mt-6"
                    
                  >
                    <div className="w-full flex gap-4 flex-row justify-between">
                      <div className="flex flex-col space-y-2">
                        <h3 className="text-[15px] text-default-500">
                          {item.title}
                        </h3>
                        <p className="text-[15px] font-medium">{item.subtitle}</p>
                        <p className="text-[10px] text-[#494949]">
                          작성일 :{" "}
                          {new Date(item.created_at).getFullYear()}년{" "}
                          {new Date(item.created_at).getMonth() + 1}월{" "}
                          {new Date(item.created_at).getDate()}일
                        </p>
                      </div>
                      <Image
                        alt="Card thumbnail"
                        className="object-cover w-24 h-24 rounded-3xl"
                        src={item.photo[0].url}
                      />
                    </div>
                  </div>
                </div>
                {index < visibleCount - 1 && <Divider orientation="horizontal" className="w-[90%]" />}
              </React.Fragment>
            ))}
          </div>
          <div className="flex flex-col justify-center items-center mt-6 mb-24">
            {!allLoaded ? (
              <FaPlusCircle
                className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
                onClick={loadMore}
              />
            ) : (
              <p className="text-gray-500 text-sm">
                모든 매거진을 불러왔습니다
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
