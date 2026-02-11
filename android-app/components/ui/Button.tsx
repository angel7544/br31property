import { Text, TouchableOpacity, TouchableOpacityProps, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({ variant = 'default', size = 'default', children, style, ...props }: ButtonProps) {
  
  const getButtonStyle = () => {
    let stylesToApply: ViewStyle[] = [styles.base];

    // Variant styles
    switch (variant) {
      case 'outline':
        stylesToApply.push(styles.variantOutline);
        break;
      case 'ghost':
        stylesToApply.push(styles.variantGhost);
        break;
      case 'destructive':
        stylesToApply.push(styles.variantDestructive);
        break;
      case 'link':
        stylesToApply.push(styles.variantLink);
        break;
      default:
        stylesToApply.push(styles.variantDefault);
        break;
    }

    // Size styles
    switch (size) {
      case 'sm':
        stylesToApply.push(styles.sizeSm);
        break;
      case 'lg':
        stylesToApply.push(styles.sizeLg);
        break;
      case 'icon':
        stylesToApply.push(styles.sizeIcon);
        break;
      default:
        stylesToApply.push(styles.sizeDefault);
        break;
    }

    if (style) {
      stylesToApply.push(style);
    }

    return stylesToApply;
  };

  const getTextStyle = () => {
    let stylesToApply: TextStyle[] = [styles.textBase];

    switch (variant) {
      case 'outline':
      case 'ghost':
        stylesToApply.push(styles.textOutlineGhost);
        break;
      case 'link':
        stylesToApply.push(styles.textLink);
        break;
      default:
        stylesToApply.push(styles.textDefault);
        break;
    }

    return stylesToApply;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      activeOpacity={0.7}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={getTextStyle()}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  // Variants
  variantDefault: {
    backgroundColor: '#0f172a',
  },
  variantOutline: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  variantGhost: {
    backgroundColor: 'transparent',
  },
  variantDestructive: {
    backgroundColor: '#ef4444',
  },
  variantLink: {
    backgroundColor: 'transparent',
  },
  // Sizes
  sizeDefault: {
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  sizeLg: {
    height: 44,
    paddingHorizontal: 32,
    borderRadius: 6,
  },
  sizeIcon: {
    height: 40,
    width: 40,
  },
  // Text Styles
  textBase: {
    fontWeight: '500',
    fontSize: 14,
  },
  textDefault: {
    color: '#fff',
  },
  textOutlineGhost: {
    color: '#0f172a',
  },
  textLink: {
    color: '#0f172a',
    textDecorationLine: 'underline',
  },
});
