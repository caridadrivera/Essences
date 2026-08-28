import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import type { AnalysisResult, HiveTopic } from '../services/sentimentAnalysis';

interface Props {
  result: AnalysisResult;
  allTopics: HiveTopic[];
  onPostToHive: (topicId: string) => void;
  onKeepInJournal: () => void;
}

// Sentiments that warrant steering the user toward privacy.
const PRIVATE_SENTIMENTS = new Set(['vulnerable', 'grieving']);

export default function PostDestinationPrompt({
  result,
  allTopics,
  onPostToHive,
  onKeepInJournal,
}: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const preferPrivate =
    result.intensity >= 4 || PRIVATE_SENTIMENTS.has(result.sentiment);

  const suggestedHive = allTopics.find((t) => t.id === result.suggestedHiveId) ?? null;

  const handlePickHive = (topicId: string) => {
    setPickerVisible(false);
    onPostToHive(topicId);
  };

  return (
    <View style={styles.container}>
      {/* ── Sentiment badge ── */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {result.sentiment} · intensity {result.intensity}/5
        </Text>
      </View>

      {/* ── Themes ── */}
      {result.themes.length > 0 && (
        <View style={styles.themesRow}>
          {result.themes.map((t) => (
            <View key={t} style={styles.themeChip}>
              <Text style={styles.themeChipText}>{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Reasoning / suggestion ── */}
      <Text style={styles.reasoning}>{result.reasoning}</Text>

      {/* ── Suggested Hive card (only when a match exists) ── */}
      {suggestedHive && (
        <View style={[styles.hiveCard, preferPrivate && styles.hiveCardMuted]}>
          <Text style={styles.hiveCardLabel}>Suggested Hive</Text>
          <Text style={styles.hiveCardTitle}>{suggestedHive.title}</Text>
        </View>
      )}

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        {/* "Keep in Journal" is visually primary when entry is intense or private-sentiment */}
        <TouchableOpacity
          style={[styles.btn, preferPrivate ? styles.btnPrimary : styles.btnSecondary]}
          onPress={onKeepInJournal}
          accessibilityRole="button"
          accessibilityLabel="Keep this entry in your private journal"
        >
          <Text style={[styles.btnText, preferPrivate ? styles.btnTextPrimary : styles.btnTextSecondary]}>
            Keep in Journal
          </Text>
        </TouchableOpacity>

        {suggestedHive && (
          <TouchableOpacity
            style={[styles.btn, preferPrivate ? styles.btnSecondary : styles.btnPrimary]}
            onPress={() => onPostToHive(suggestedHive.id)}
            accessibilityRole="button"
            accessibilityLabel={`Post to the ${suggestedHive.title} Hive`}
          >
            <Text style={[styles.btnText, preferPrivate ? styles.btnTextSecondary : styles.btnTextPrimary]}>
              Post to {suggestedHive.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Manual Hive picker ── */}
      <TouchableOpacity
        style={styles.pickerTrigger}
        onPress={() => setPickerVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Choose a different Hive"
      >
        <Text style={styles.pickerTriggerText}>
          {suggestedHive ? 'Choose a different Hive' : 'Pick a Hive to post to'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Choose a Hive</Text>
            <FlatList
              data={allTopics}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === result.suggestedHiveId && styles.pickerItemHighlighted,
                  ]}
                  onPress={() => handlePickHive(item.id)}
                >
                  <Text style={styles.pickerItemText}>{item.title}</Text>
                  {item.id === result.suggestedHiveId && (
                    <Text style={styles.pickerItemSuggested}>suggested</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.peach,
    borderRadius: theme.designRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: hp(1.5),
    color: theme.colors.inkPrimary,
    fontWeight: theme.fonts.semibold,
  },
  themesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  themeChip: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: theme.designRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  themeChipText: {
    fontSize: hp(1.5),
    color: theme.colors.inkSecondary,
  },
  reasoning: {
    fontSize: hp(1.8),
    color: theme.colors.inkSecondary,
    lineHeight: hp(2.6),
  },
  hiveCard: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    borderRadius: theme.designRadius.md,
    padding: 12,
  },
  hiveCardMuted: {
    opacity: 0.6,
  },
  hiveCardLabel: {
    fontSize: hp(1.4),
    color: theme.colors.inkDisabled,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hiveCardTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.inkPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.designRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: theme.colors.inkPrimary,
  },
  btnSecondary: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  btnText: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  btnTextPrimary: {
    color: theme.colors.surfaceBase,
  },
  btnTextSecondary: {
    color: theme.colors.inkPrimary,
  },
  pickerTrigger: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  pickerTriggerText: {
    fontSize: hp(1.6),
    color: theme.colors.rust,
    textDecorationLine: 'underline',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: theme.colors.surfaceBase,
    borderTopLeftRadius: theme.designRadius.lg,
    borderTopRightRadius: theme.designRadius.lg,
    padding: 20,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: hp(2.2),
    fontFamily: theme.fonts.display,
    color: theme.colors.inkPrimary,
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  pickerItemHighlighted: {
    backgroundColor: theme.colors.peach + '33',
    borderRadius: theme.designRadius.sm,
    paddingHorizontal: 8,
  },
  pickerItemText: {
    fontSize: hp(2),
    color: theme.colors.inkPrimary,
  },
  pickerItemSuggested: {
    fontSize: hp(1.4),
    color: theme.colors.rust,
    fontStyle: 'italic',
  },
});
