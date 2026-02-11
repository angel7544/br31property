import { View, Text, ViewProps, TextProps } from 'react-native';
import { cn } from '../../lib/utils';

export function Card({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'rounded-lg border border-slate-200 bg-white shadow-sm elevation-1',
        className
      )}
      {...props}
    />
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
