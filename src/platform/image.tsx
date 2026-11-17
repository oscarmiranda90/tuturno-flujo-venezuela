import { Image as RNImage, type ImageProps } from 'react-native';
export function Image({contentFit, transition, cachePolicy, priority, recyclingKey, decodeFormat, enforceEarlyResizing, useAppleWebpCodec, ...props}: ImageProps & {contentFit?: 'contain'|'cover';transition?: number;cachePolicy?: string;priority?: string;recyclingKey?: string;decodeFormat?: string;enforceEarlyResizing?: boolean;useAppleWebpCodec?: boolean}) {
 return <RNImage {...props} resizeMode={contentFit ?? props.resizeMode} />;
}
