import React from "react";
import {cn} from "@heroui/react";

import Review from "./review";

const CardReview = React.forwardRef(({className, ...review}, ref) => (
  <div ref={ref} className={cn("rounded-medium bg-content1 p-5 mx-2 shadow-small w-full", className)}>
    <Review {...review} />
  </div>
));

CardReview.displayName = "CardReview";

export default CardReview;
