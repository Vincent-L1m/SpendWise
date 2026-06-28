import logoImg from "../assets/logo.png";

/**
 * Logo component
 * height: px height of the image (width scales automatically)
 * textOnly: show just "SpendWise" text without the image
 * iconOnly: show just the fox icon cropped
 */
export default function Logo({ height = 36, style = {} }) {
  return (
    <img
      src={logoImg}
      alt="SpendWise"
      height={height}
      style={{ height, width: "auto", display: "block", objectFit: "contain", ...style }}
      draggable={false}
    />
  );
}
