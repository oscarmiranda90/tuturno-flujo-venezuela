import { Image, StyleSheet, View } from 'react-native';

import { radius, borderCurve, useTheme } from '../theme';

interface BrandMarkProps {
  size?: number;
  /** Dibuja el fondo azul oscuro de la marca. Se desactiva si la marca ya tiene fondo. */
  framed?: boolean;
}

/** Marca de Tu Turno. Se utiliza el recurso original aprobado, con los bloques verdes y azules que cruzan la S. El dibujo ya incluye el fondo azul oscuro; `framed` redondea sus esquinas sin añadir otro fondo. */
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
