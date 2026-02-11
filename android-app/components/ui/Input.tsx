import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {}

export function Input({ style, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#94a3b8"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    width: '100%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0f172a',
  },
});
