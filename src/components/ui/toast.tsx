import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../theme/colors';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  actionButton?: {
    text: string;
    onPress: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onClose,
  actionButton,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  // Memoize the toast config to prevent style recalculation
  const config = useMemo(() => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          colors: ['#10b981', '#059669'],
          iconColor: '#10b981',
          bgColor: '#ecfdf5',
          borderColor: '#10b981',
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          colors: [COLORS.redAccent, '#dc2626'] as [string, string],
          iconColor: COLORS.redAccent,
          bgColor: '#fef2f2',
          borderColor: COLORS.redAccent,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          colors: [COLORS.gold, '#d97706'] as [string, string],
          iconColor: COLORS.gold,
          bgColor: '#fffbeb',
          borderColor: COLORS.gold,
        };
      default:
        return {
          icon: 'information-circle' as const,
          colors: [COLORS.maroon, '#6A0032'] as [string, string],
          iconColor: COLORS.maroon,
          bgColor: '#fef2f2',
          borderColor: COLORS.maroon,
        };
    }
  }, [type]);

  const handleClose = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [slideAnim, opacityAnim, onClose]);

  // Memoize animated style to prevent hook order violations
  const animatedStyle = useMemo(() => [
    styles.toastContainer,
    {
      transform: [{ translateY: slideAnim }],
      opacity: opacityAnim,
    },
  ], [slideAnim, opacityAnim]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [visible, duration, handleClose]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={animatedStyle}
        >
          <View style={[styles.toast, { backgroundColor: config.bgColor, borderColor: config.borderColor }]}>
            <View style={styles.content}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
              <View style={styles.iconContainerTop}>
                <View style={[styles.iconCircle, { backgroundColor: `${config.iconColor}15` }]}>
                  <Ionicons name={config.icon} size={32} color={config.iconColor} />
                </View>
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.message}>{message}</Text>
              </View>
            </View>
            {actionButton && (
              <TouchableOpacity
                onPress={() => {
                  actionButton.onPress();
                  handleClose();
                }}
                style={[styles.actionButton, { borderTopColor: config.borderColor }]}
              >
                <LinearGradient
                  colors={config.colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>{actionButton.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastContainer: {
    width: width - 32,
    maxWidth: 400,
  },
  toast: {
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  iconContainerTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
    textAlign: 'center',
  },
  actionButton: {
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

// Helper function to show toast
let toastRef: {
  show: (message: string, type?: ToastType, actionButton?: { text: string; onPress: () => void }) => void;
  hide: () => void;
} | null = null;

export const showToast = (
  message: string,
  type: ToastType = 'info',
  actionButton?: { text: string; onPress: () => void }
) => {
  if (toastRef) {
    toastRef.show(message, type, actionButton);
  }
};

export const hideToast = () => {
  if (toastRef) {
    toastRef.hide();
  }
};

export const setToastRef = (ref: typeof toastRef) => {
  toastRef = ref;
};

// Toast Manager Component
export const ToastManager: React.FC = () => {
  const [visible, setVisible] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [type, setType] = React.useState<ToastType>('info');
  const [actionButton, setActionButton] = React.useState<{ text: string; onPress: () => void } | undefined>();

  React.useEffect(() => {
    setToastRef({
      show: (msg, toastType, action) => {
        setMessage(msg);
        setType(toastType || 'info');
        setActionButton(action);
        setVisible(true);
      },
      hide: () => {
        setVisible(false);
      },
    });
  }, []);

  return (
    <Toast
      visible={visible}
      message={message}
      type={type}
      onClose={() => setVisible(false)}
      actionButton={actionButton}
      duration={actionButton ? 0 : 3000}
    />
  );
};

