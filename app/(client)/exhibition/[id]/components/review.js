"use client";

import React from "react";
import {User} from "@heroui/react";
import {Icon} from "@iconify/react";
import {cn} from "@heroui/react";

const Review = React.forwardRef(
  ({children, user, title, content, rating, createdAt, ...props}, ref) => (
    <div ref={ref} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User
            avatarProps={{
              src: user.avatar,
            }}
            classNames={{
              name: "font-medium",
              description: "text-small",
            }}
            description={new Intl.DateTimeFormat("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date(createdAt))}
            name={user.name}
          />
        </div>
        <div className="flex items-center gap-1">
          {Array.from({length: 5}, (_, i) => {
            const isSelected = i + 1 <= rating;

            return (
              <Icon
                key={i}
                className={cn(
                  "text-lg sm:text-xl",
                  isSelected ? "text-warning" : "text-default-200",
                )}
                icon="solar:star-bold"
              />
            );
          })}
        </div>
      </div>
      <div className="mt-4 w-full">
        <p className="font-medium text-default-900">{title}</p>
        <p className="mt-2 text-default-500">{content || children}</p>
      </div>
    </div>
  ),
);

Review.displayName = "Review";

export default Review;
