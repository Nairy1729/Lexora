import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, borderRadius, typography } from './src/constants/theme';
import { layout } from './src/constants/layout';
import { useGame } from './src/hooks/useGame';
import { GameHeader } from './src/components/game/GameHeader';
import { GameBoard } from './src/components/game/GameBoard';
import { GameKeyboard } from './src/components/game/GameKeyboard';
import { GameMessage } from './src/components/game/GameMessage';
import { GameOverPanel } from './src/components/game/GameOverPanel';
import { VictoryCelebration } from './src/components/game/VictoryCelebration';
import { HelpModal } from './src/components/game/HelpModal';
import { StatsModal } from './src/components/modals/StatsModal';
import { SettingsModal } from './src/components/modals/SettingsModal';
import { useWebKeyboard } from './src/hooks/useWebKeyboard';

export default function App() {
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { height } = useWindowDimensions();

  const {
    puzzleInfo,
    guesses,
    evaluations,
    currentGuess,
    gameStatus,
    keyboardStatus,
    message,
    isPracticeMode,
    stats,
    isStatsVisible,
    currentWinAttempt,
    openStats,
    closeStats,
    onKeyPress,
    startPracticeGame,
    resetDailyGame,
    revealingRowIndex,
    winningRowIndex,
    shakeTrigger,
    showVictoryCelebration,
    dismissVictoryCelebration,
    settings,
    updateSettings,
    resetAllData,
    shareText,
    shareGame,
  } = useGame();

  const isGameOver = gameStatus !== 'playing';
  const isAnyModalVisible = helpVisible || isStatsVisible || settingsVisible;

  useWebKeyboard({
    onKeyPress,
    disabled: isAnyModalVisible,
  });

  // Responsive layout calibration:
  // 1. Bottom breathing room: ensures the keyboard never crowds against Android gesture pill or 3-button nav
  const bottomBreathingRoom = Platform.OS === 'android'
    ? Math.max(20, Math.min(Math.round(height * 0.032), 30))
    : Math.max(14, Math.min(Math.round(height * 0.024), 24));

  // 2. Cohesive grid-to-keyboard bridge gap: maintains intimate visual dialogue between puzzle and keys (~14-22dp)
  const boardKeyboardGap = Math.max(12, Math.min(Math.round(height * 0.022), 22));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* Subtle ambient warm lighting for espresso depth */}
        <View style={styles.ambientGlow} pointerEvents="none" />

        {/* Compact Brand Header with Help, Stats, and Settings toggles */}
        <GameHeader
          puzzleNumber={puzzleInfo.puzzleNumber}
          isPracticeMode={isPracticeMode}
          onPracticeToggle={isPracticeMode ? resetDailyGame : startPracticeGame}
          onStatsToggle={openStats}
          onHelpToggle={() => setHelpVisible(true)}
          onSettingsToggle={() => setSettingsVisible(true)}
        />

        {/* Unified Gameplay Arena */}
        <View style={styles.gameArena}>
          {/* Transient warning / status banner */}
          <GameMessage message={message} />

          {/* Flexible upper cushion: absorbs excess height gracefully on tall viewports */}
          <View style={[styles.topCushion, isGameOver && styles.topCushionGameOver]} />

          {/* Centered Board Area */}
          <View style={styles.boardArea}>
            <GameBoard
              guesses={guesses}
              evaluations={evaluations}
              currentGuess={currentGuess}
              revealingRowIndex={revealingRowIndex}
              winningRowIndex={winningRowIndex}
              shakeTrigger={shakeTrigger}
            />

            {/* Premium Glassmorphic End-of-game Card */}
            {isGameOver && (
              <GameOverPanel
                gameStatus={gameStatus}
                guessesCount={guesses.length}
                solution={puzzleInfo.solution}
                isPracticeMode={isPracticeMode}
                onShare={shareGame}
                onOpenStats={openStats}
                onPractice={startPracticeGame}
                onDaily={resetDailyGame}
              />
            )}
          </View>

          {/* Cohesive visual connection bridge between board and keyboard */}
          <View style={{ height: boardKeyboardGap }} />

          {/* In-Game Keyboard with dedicated bottom clearance */}
          <View style={[styles.keyboardArea, { paddingBottom: bottomBreathingRoom }]}>
            <GameKeyboard
              onKeyPress={onKeyPress}
              keyboardStatus={keyboardStatus}
            />
          </View>
        </View>

        {/* Victory particle celebration burst */}
        {showVictoryCelebration && (
          <VictoryCelebration onComplete={dismissVictoryCelebration} />
        )}

        {/* Tutorial & Rules Modal */}
        <HelpModal
          visible={helpVisible}
          onClose={() => setHelpVisible(false)}
        />

        {/* Career Statistics Modal */}
        <StatsModal
          visible={isStatsVisible}
          stats={stats}
          currentWinAttempt={currentWinAttempt}
          isGameOver={isGameOver}
          shareText={shareText}
          onClose={closeStats}
        />

        {/* Settings & Preferences Modal */}
        <SettingsModal
          visible={settingsVisible}
          hapticsEnabled={settings.hapticsEnabled}
          dailyRemindersEnabled={settings.dailyRemindersEnabled}
          onToggleHaptics={(val) => updateSettings({ hapticsEnabled: val })}
          onToggleReminders={(val) => updateSettings({ dailyRemindersEnabled: val })}
          onResetData={resetAllData}
          onClose={() => setSettingsVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0,
    paddingBottom: Platform.OS === 'android' ? 6 : 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    top: '12%',
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 122, 0, 0.045)',
  },
  gameArena: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  topCushion: {
    flex: 1,
    minHeight: 6,
  },
  topCushionGameOver: {
    flex: 0.35,
    minHeight: 2,
  },
  boardArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  keyboardArea: {
    width: '100%',
  },
});
