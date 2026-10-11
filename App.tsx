import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { colors, spacing } from './src/constants/theme';
import { layout, calculateGameplayLayout } from './src/constants/layout';
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
import { AppLaunchScreen } from './src/components/common/AppLaunchScreen';
import { useWebKeyboard } from './src/hooks/useWebKeyboard';

// Prevent static native splash screen from hiding prematurely
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { width, height } = useWindowDimensions();

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
    isHydrated,
  } = useGame();

  const isGameOver = gameStatus !== 'playing';
  const isAnyModalVisible = helpVisible || isStatsVisible || settingsVisible;

  // Dismiss native splash cleanly once React root has mounted with AppLaunchScreen
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useWebKeyboard({
    onKeyPress,
    disabled: isAnyModalVisible || showLaunchScreen,
  });

  const layoutMetrics = calculateGameplayLayout(width, height, isGameOver);

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

          {/* Balanced upper breathing room */}
          <View style={{ height: layoutMetrics.topGap }} />

          {/* Centered Board Area */}
          <View style={styles.boardArea}>
            <GameBoard
              guesses={guesses}
              evaluations={evaluations}
              currentGuess={currentGuess}
              revealingRowIndex={revealingRowIndex}
              winningRowIndex={winningRowIndex}
              shakeTrigger={shakeTrigger}
              tileSize={layoutMetrics.tileSize}
              tileGap={layoutMetrics.tileGap}
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

          {/* Distinct, spacious separation between board and keyboard */}
          <View style={{ height: layoutMetrics.middleGap }} />

          {/* In-Game Keyboard with dedicated bottom clearance */}
          <View style={[styles.keyboardArea, { paddingBottom: layoutMetrics.bottomGap }]}>
            <GameKeyboard
              onKeyPress={onKeyPress}
              keyboardStatus={keyboardStatus}
              keyHeight={layoutMetrics.keyHeight}
              rowGap={layoutMetrics.keyboardRowGap}
              enterHeight={layoutMetrics.enterButtonHeight}
              enterGap={layoutMetrics.enterGap}
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

        {/* Cinematic Animated App Launch Experience */}
        {showLaunchScreen && (
          <AppLaunchScreen
            isReady={isHydrated}
            onAnimationComplete={() => setShowLaunchScreen(false)}
          />
        )}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
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
