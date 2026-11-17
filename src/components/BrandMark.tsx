import { Image, StyleSheet, View } from 'react-native';

import { radius, borderCurve, useTheme } from '../theme';

interface BrandMarkProps {
  size?: number;
  /** Draws the navy tile behind the mark. Off when it already sits on brand. */
  framed?: boolean;
}

/**
 * The Tu Turno mark.
 *
 * This used to be a hand-drawn SVG approximation, which was wrong in a way that
 * only the brand owner could catch: it looked like a dollar sign, but not like
 * THIS dollar sign. The real mark has the green and blue blocks crossing the S,
 * and no amount of redrawing gets a logo right — a brand mark is an asset, not
 * an interpretation.
 *
 * The source artwork already carries its navy ground, so `framed` only rounds
 * the corners rather than painting a tile behind it.
 */
export function BrandMark({ size = 32, framed = true }: BrandMarkProps) {
  const theme = useTheme();

  if (!framed) {
    return (
      <Image
        source={SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Tu Turno"
      />
    );
  }

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size * 0.26,
          backgroundColor: theme.surface.brand,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Tu Turno"
    >
      <Image
        source={SOURCE}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

const SOURCE = require('../../assets/icon.png');

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve,
    overflow: 'hidden',
  },
});
