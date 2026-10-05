import { RiArrowRightSLine } from "react-icons/ri";
import { BasicChip } from "./Chip";
import { LuArrowRight } from "react-icons/lu";

export interface CourseCardProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onViewMore?: () => void;
  className?: string;
  value: string;
}

/** A text card with a title, a short description, a meta line and a footer button with an arrow. */
const CardType1 = ({
  title,
  description,
  ctaLabel = "View more",
  onViewMore,
  className = "",
  value,
}: CourseCardProps) => (
  <div
    className={`bg-white dark:bg-slate-800 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] rounded-md w-full md:max-w-[80%] ${className} p-4`}
  >
    <div>
      <div className="flex gap-4 items-center">
        <h2 className="text-xl dark:text-white font-semibold leading-[28px]">
          {title}
        </h2>
        <BasicChip>{value}</BasicChip>
      </div>
      <p className="text-base dark:text-white/80 text-gray-600 mt-2 mb-4">
        {description}
      </p>
    </div>

    {!!onViewMore && (
      <button
        type="button"
        onClick={onViewMore}
        className="flex items-center justify-between w-full"
      >
        <LuArrowRight
          aria-hidden
          className="hover:text-[#3B9DF8] transition-all duration-200 cursor-pointer ml-auto"
          size={30}
        />
      </button>
    )}
  </div>
);

export default CardType1;
