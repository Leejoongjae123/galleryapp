import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "img1.kakaocdn.net", 
      "t1.kakaocdn.net",
      "k.kakaocdn.net",
      "teaelrzxuigiocnukwha.supabase.co",
      "search.pstatic.net",
      "picsum.photos",
      "i.postimg.cc",
      "mcst.go.kr",
      "img0.yna.co.kr",
      "www.culture.go.kr"
    ],
  },
  webpack(config) {
    // SVG 파일을 컴포넌트로 가져올 수 있도록 설정
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ 
        loader: '@svgr/webpack',
        options: { 
          svgoConfig: {
            plugins: [{
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false
                },
              },
            }],
          }
        }
      }],
    });

    return config;
  },
};

export default nextConfig;
