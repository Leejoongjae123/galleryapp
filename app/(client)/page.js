"use client";
import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ExhibitionCarousel } from "./components/exhibition-carousel";
import { CategoryButtons } from "./components/category-buttons";
import { ExhibitionCards } from "./components/exhibition-cards";
import { GallerySection } from "./components/gallery-section";
import { MagazineCarousel } from "./components/magazine-carousel";
import { Input, Tabs, Tab, Card, CardBody, Button } from "@heroui/react";
import { useEffect, useState } from "react";
import GalleryCards from "./components/gallery-cards";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
export default function Home() {
  const [exhibitionCategory, setExhibitionCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("recommended");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const supabase = createClient();
  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error);
    } else {
      setUser(data?.user);
    }
  };
  useEffect(() => {
    getUser();
  }, []);
  const getFavorites = async () => {
    const { data, error } = await supabase
      .from("favorite")
      .select("*")
      .eq("name", user.email);
    if (error) {
      console.error("Error fetching favorites:", error);
    } else {
      setFavorites(data || []);
    }
  };

  return (
    <div className="flex flex-col gap-3 justify-center items-center w-full">
      {/* Banner Carousel */}
      <ExhibitionCarousel user={user} />

      {/* Category Buttons */}
      <CategoryButtons />

      {/* Exhibition Tabs */}
      <div className="w-full flex flex-col mb-4 justify-center items-center mt-4">
        <div className="flex w-[90%] border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "all" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("all")}
            >
              전체전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "free" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("free")}
            >
              무료전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("recommended")}
            >
              추천전시
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>
        
        <ExhibitionCards
          exhibitionCategory={exhibitionCategory}
          user={user}
        />
      </div>

      {/* Gallery Section */}
      <div className="w-full flex flex-col mb-4 justify-center items-center">
        <div className="flex w-[90%] border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("recommended")}
            >
              추천갤러리
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "new" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("new")}
            >
              신규갤러리
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "now" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("now")}
            >
              전시갤러리
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>
        
        <GalleryCards selectedTab={selectedTab} user={user} />
      </div>

      {/* Magazine Section */}
      <MagazineCarousel />
      <div className="flex flex-row gap-4 pb-16 bg-[hsl(0,0%,93%)] w-full justify-center items-center">
        <div className="w-[30%] h-full flex justify-center items-center ">
          <Image
            src="/footer/footer.png"
            alt="noimage"
            width={37}
            height={37}
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEhgJAi9TUHAAAAABJRU5ErkJggg=="
          />
        </div>
        <div className="w-[70%] h-full text-[6px] flex flex-col justify-center items-center">
          <p>(주) 아트앤브릿지  대표 : 박명서</p>
          <p>
            서울특별시 금천구 가산디지털 1 로 19, 16 층 1609-엘 04호 (가산동,
            대륭테크노타운 18 차 ){" "}
          </p>
          <p>사업자번호 137-87-03464 통신판매업 제2024-서울금천-2468호 </p>
          <p>이메일 rena35200@gmail.com / 개인정보보호책임자 : 김주홍</p>
          <p>고객센터,카카오채널 : 미술예술랭</p>
        </div>
      </div>
    </div>
  );
}
