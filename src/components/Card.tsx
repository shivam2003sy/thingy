import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CardProps {
  title: string;
  icon?: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  description,
  selected = false,
  onPress,
  className = '',
  children,
}) => {
  const Component = onPress ? Pressable : View;
  
  return (
    <Component
      onPress={onPress}
      style={[
        styles.card,
        selected ? styles.cardSelected : styles.cardUnselected,
      ]}
    >
      {icon && <Icon name={icon} size={56} color="#ffffff" style={styles.icon} />}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
  },
  cardSelected: {
    borderColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  cardUnselected: {
    borderColor: '#1f2937',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 8,
  },
  description: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
