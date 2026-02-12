import { View, Text, ViewProps, TextProps, StyleSheet } from 'react-native';
import { cn } from '../../lib/utils';
import { BlurView } from 'expo-blur';

export function Card({ className, children, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'rounded-xl border border-white/40 overflow-hidden shadow-sm elevation-1',
        className
      )}
      {...props}
    >
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
        {children}
      </View>
    </View>
  );
}

export function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight text-slate-900',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: TextProps) {
  return (
    <Text
      className={cn('text-sm text-slate-500', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn('flex-row items-center p-6 pt-0', className)} {...props} />;
}
