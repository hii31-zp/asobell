import { Text, TextProps } from "react-native";

export function MyText({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={`font-rounded tracking-widest ${className || ""}`}
      {...props}
    />
  );
}
