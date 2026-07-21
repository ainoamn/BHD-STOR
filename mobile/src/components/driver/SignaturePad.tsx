import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Path, Skia, useCanvasRef } from '@shopify/react-native-skia';
import type { SkPath } from '@shopify/react-native-skia';

export interface SignaturePadRef {
  clear: () => void;
  save: () => string | null;
  getData: () => string | null;
}

interface SignaturePadProps {
  onSave?: (base64Image: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  penColor?: string;
  penSize?: number;
  backgroundColor?: string;
  readonly?: boolean;
  savedSignature?: string | null;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>((
  {
    onSave,
    onClear,
    width = Dimensions.get('window').width - 32,
    height = 220,
    penColor = '#111827',
    penSize = 2.5,
    backgroundColor = '#fff',
    readonly = false,
    savedSignature,
  },
  ref,
) => {
  const [paths, setPaths] = useState<SkPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useCanvasRef();

  // Convert saved signature to display
  React.useEffect(() => {
    if (savedSignature) {
      setHasSignature(true);
    }
  }, [savedSignature]);

  const panGesture = Gesture.Pan()
    .enabled(!readonly)
    .minDistance(1)
    .onBegin(event => {
      const newPath = Skia.Path.Make();
      newPath.moveTo(event.x, event.y);
      setCurrentPath(newPath);
    })
    .onUpdate(event => {
      if (currentPath) {
        currentPath.lineTo(event.x, event.y);
        // Force re-render
        setPaths(prev => [...prev]);
      }
    })
    .onEnd(() => {
      if (currentPath) {
        setPaths(prev => [...prev, currentPath]);
        setCurrentPath(null);
        setHasSignature(true);
      }
    });

  const clear = useCallback(() => {
    setPaths([]);
    setCurrentPath(null);
    setHasSignature(false);
    onClear?.();
  }, [onClear]);

  const save = useCallback((): string | null => {
    if (!hasSignature || !canvasRef.current) return null;
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      const base64 = snapshot.encodeToBase64();
      if (base64) {
        onSave?.(base64);
        return base64;
      }
      return null;
    } catch (error) {
      console.error('Failed to save signature:', error);
      return null;
    }
  }, [hasSignature, canvasRef, onSave]);

  const getData = useCallback((): string | null => {
    if (!hasSignature || !canvasRef.current) return null;
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      return snapshot.encodeToBase64() || null;
    } catch {
      return null;
    }
  }, [hasSignature, canvasRef]);

  useImperativeHandle(ref, () => ({
    clear,
    save,
    getData,
  }));

  // If there's a saved signature in preview mode, show it
  if (savedSignature && readonly) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Image
          source={{ uri: `data:image/png;base64,${savedSignature}` }}
          style={[styles.canvas, { width, height }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width }]}>
      <View
        style={[
          styles.container,
          { width, height, backgroundColor },
          !readonly && styles.containerActive,
        ]}
      >
        {/* Placeholder text */}
        {!hasSignature && (
          <View style={styles.placeholder}>
            <Icon name="signature" size={32} color="#D1D5DB" />
            <Text style={styles.placeholderText}>Sign here</Text>
          </View>
        )}

        {/* X Line */}
        <View style={[styles.xLine, { width: width - 40 }]} />
        <Text style={styles.xLabel}>X</Text>

        {/* Canvas for drawing */}
        <GestureDetector gesture={panGesture}>
          <View style={{ width, height }}>
            <Canvas ref={canvasRef} style={{ width, height }}>
              {paths.map((path, index) => (
                <Path
                  key={`path-${index}`}
                  path={path}
                  color={penColor}
                  style="stroke"
                  strokeWidth={penSize}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ))}
              {currentPath && (
                <Path
                  path={currentPath}
                  color={penColor}
                  style="stroke"
                  strokeWidth={penSize}
                  strokeCap="round"
                  strokeJoin="round"
                />
              )}
            </Canvas>
          </View>
        </GestureDetector>
      </View>

      {/* Controls */}
      {!readonly && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.clearButton} onPress={clear}>
            <Icon name="eraser" size={18} color="#EF4444" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.saveButton, !hasSignature && styles.saveButtonDisabled]}
            onPress={save}
            disabled={!hasSignature}
          >
            <Icon name="check" size={18} color={hasSignature ? '#fff' : '#9CA3AF'} />
            <Text
              style={[
                styles.saveText,
                !hasSignature && styles.saveTextDisabled,
              ]}
            >
              Confirm Signature
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

SignaturePad.displayName = 'SignaturePad';

// Fallback SignaturePad using PanResponder (no Skia)
export const SignaturePadFallback = forwardRef<SignaturePadRef, SignaturePadProps>(
  (
    {
      onSave,
      onClear,
      width = Dimensions.get('window').width - 32,
      height = 220,
      penColor = '#111827',
      penSize = 2.5,
      backgroundColor = '#fff',
      readonly = false,
      savedSignature,
    },
    ref,
  ) => {
    const [hasSignature, setHasSignature] = useState(false);
    const [strokes, setStrokes] = useState<Array<{ x: number; y: number }[]>>([]);
    const [currentStroke, setCurrentStroke] = useState<Array<{ x: number; y: number }>>([]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => !readonly,
        onMoveShouldSetPanResponder: () => !readonly,
        onPanResponderGrant: event => {
          const { locationX, locationY } = event.nativeEvent;
          setCurrentStroke([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: event => {
          const { locationX, locationY } = event.nativeEvent;
          setCurrentStroke(prev => [...prev, { x: locationX, y: locationY }]);
        },
        onPanResponderRelease: () => {
          if (currentStroke.length > 0) {
            setStrokes(prev => [...prev, currentStroke]);
            setCurrentStroke([]);
            setHasSignature(true);
          }
        },
      }),
    ).current;

    const clear = useCallback(() => {
      setStrokes([]);
      setCurrentStroke([]);
      setHasSignature(false);
      onClear?.();
    }, [onClear]);

    const pointsToSvgPath = (points: Array<{ x: number; y: number }>): string => {
      if (points.length === 0) return '';
      let path = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
      }
      return path;
    };

    const save = useCallback((): string | null => {
      // In a real implementation, you'd use react-native-view-shot to capture the view
      // For now, return a mock base64
      if (!hasSignature) return null;
      const mockBase64 = 'mock-signature-data';
      onSave?.(mockBase64);
      return mockBase64;
    }, [hasSignature, onSave]);

    const getData = useCallback((): string | null => {
      if (!hasSignature) return null;
      return 'mock-signature-data';
    }, [hasSignature]);

    useImperativeHandle(ref, () => ({
      clear,
      save,
      getData,
    }));

    if (savedSignature && readonly) {
      return (
        <View style={[styles.container, { width, height }]}>
          <Image
            source={{ uri: `data:image/png;base64,${savedSignature}` }}
            style={[styles.canvas, { width, height }]}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View style={[styles.wrapper, { width }]}>
        <View
          style={[
            styles.container,
            { width, height, backgroundColor },
            !readonly && styles.containerActive,
          ]}
          {...panResponder.panHandlers}
        >
          {!hasSignature && currentStroke.length === 0 && (
            <View style={styles.placeholder}>
              <Icon name="signature" size={32} color="#D1D5DB" />
              <Text style={styles.placeholderText}>Sign here</Text>
            </View>
          )}

          <View style={[styles.xLine, { width: width - 40 }]} />
          <Text style={styles.xLabel}>X</Text>

          {/* SVG-like paths using simple View elements */}
          {[...strokes, currentStroke].map((stroke, i) =>
            stroke.length > 1 ? (
              <View key={i} style={StyleSheet.absoluteFill}>
                {/* Render stroke as connected line segments */}
                {stroke.map((point, j) =>
                  j > 0 ? (
                    <View
                      key={j}
                      style={{
                        position: 'absolute',
                        left: point.x - penSize / 2,
                        top: point.y - penSize / 2,
                        width: penSize * 2,
                        height: penSize * 2,
                        backgroundColor: penColor,
                        borderRadius: penSize,
                      }}
                    />
                  ) : null,
                )}
              </View>
            ) : null,
          )}
        </View>

        {!readonly && (
          <View style={styles.controls}>
            <TouchableOpacity style={styles.clearButton} onPress={clear}>
              <Icon name="eraser" size={18} color="#EF4444" />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={[styles.saveButton, !hasSignature && styles.saveButtonDisabled]}
              onPress={save}
              disabled={!hasSignature}
            >
              <Icon name="check" size={18} color={hasSignature ? '#fff' : '#9CA3AF'} />
              <Text style={[styles.saveText, !hasSignature && styles.saveTextDisabled]}>
                Confirm Signature
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  },
);

SignaturePadFallback.displayName = 'SignaturePadFallback';

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  containerActive: {
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  canvas: {
    borderRadius: 12,
  },
  placeholder: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 0,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  xLine: {
    position: 'absolute',
    bottom: 40,
    height: 1,
    backgroundColor: '#D1D5DB',
    zIndex: 0,
  },
  xLabel: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    zIndex: 0,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    gap: 6,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  saveTextDisabled: {
    color: '#9CA3AF',
  },
});
