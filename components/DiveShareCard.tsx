import React, { forwardRef } from 'react';
import { View, Text, Platform } from 'react-native';

type Props = {
  glyph: string;
  domainColor: string;
  domainLabel: string;
  subjectName: string;
  teacherName: string;
  layerLabel: string;
  sessionCount: number;
  durationSec: number;
  whisper: string | null;
};

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

const DiveShareCard = forwardRef<View, Props>(
  ({ glyph, domainColor, domainLabel, subjectName, teacherName, layerLabel, sessionCount, durationSec, whisper }, ref) => {
    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: 360,
          backgroundColor: '#0D0D0D',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: domainColor + '44',
          padding: 28,
          alignItems: 'center',
        }}
      >
        {/* Top label */}
        <Text style={{
          color: domainColor + '88',
          fontSize: 9,
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          letterSpacing: 3,
          fontWeight: '700',
          marginBottom: 18,
        }}>
          SOL MYSTERY SCHOOL
        </Text>

        {/* Glyph */}
        <Text style={{ color: domainColor, fontSize: 72, lineHeight: 80, marginBottom: 6 }}>
          {glyph}
        </Text>

        {/* Domain */}
        <Text style={{
          color: domainColor,
          fontSize: 10,
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          letterSpacing: 2.5,
          fontWeight: '700',
          marginBottom: 16,
        }}>
          {domainLabel.toUpperCase()}
        </Text>

        {/* Subject */}
        <Text style={{
          color: '#FFFFFF',
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          letterSpacing: 0.3,
          marginBottom: 10,
          lineHeight: 28,
        }}>
          {subjectName}
        </Text>

        {/* Meta row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Text style={{ color: domainColor, fontSize: 12, fontWeight: '700' }}>{teacherName}</Text>
          <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>·</Text>
          <Text style={{ color: '#FFFFFF66', fontSize: 11 }}>{layerLabel}</Text>
          <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>·</Text>
          <Text style={{ color: '#FFFFFF66', fontSize: 11 }}>Session {sessionCount}</Text>
          {durationSec > 0 && (
            <>
              <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>·</Text>
              <Text style={{ color: '#FFFFFF66', fontSize: 11 }}>{formatDuration(durationSec)}</Text>
            </>
          )}
        </View>

        {/* Whisper */}
        {whisper && (
          <View style={{
            width: '100%',
            borderTopWidth: 1,
            borderTopColor: domainColor + '22',
            paddingTop: 16,
            marginBottom: 16,
            alignItems: 'center',
          }}>
            <Text style={{
              color: domainColor + 'AA',
              fontSize: 9,
              fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
              letterSpacing: 2,
              marginBottom: 8,
            }}>
              ◦ SOL WHISPERS
            </Text>
            <Text style={{
              color: '#FFFFFF88',
              fontSize: 12,
              fontStyle: 'italic',
              textAlign: 'center',
              lineHeight: 18,
              paddingHorizontal: 8,
            }}>
              {whisper}
            </Text>
          </View>
        )}

        {/* Bottom rule + branding */}
        <View style={{ width: '100%', height: 1, backgroundColor: domainColor + '22', marginBottom: 14 }} />
        <Text style={{
          color: '#FFFFFF22',
          fontSize: 9,
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
          letterSpacing: 2,
        }}>
          ⊚ SOL · LYCHEETAH FRAMEWORK
        </Text>
      </View>
    );
  }
);

export default DiveShareCard;
