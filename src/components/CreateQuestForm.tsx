import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { Skull, Feather } from 'lucide-react-native';
import { QuestDifficulty, QuestCategory } from '../types';
import { soundEngine } from '../utils/audio';
import { generateQuestSuggestions } from '../utils/aiEngine';
import { COLORS, FONTS, THEME_STYLES } from '../theme';

interface CreateQuestFormProps {
  onAddQuest: (questData: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }) => void;
  prefilledDate?: string;
}

export const CreateQuestForm: React.FC<CreateQuestFormProps> = ({ onAddQuest, prefilledDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Lesser Burden');
  const [category, setCategory] = useState<QuestCategory>('General');
  const [dueDate, setDueDate] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState('');

  useEffect(() => {
    if (prefilledDate) {
      setDueDate(prefilledDate);
    }
  }, [prefilledDate]);

  const handleOracleSuggest = async () => {
    const inputSeed = title.trim() || description.trim();
    if (!inputSeed) {
      soundEngine.playClick();
      setOracleError('Provide key terms first (e.g. "go running" or "clean house").');
      setTimeout(() => setOracleError(''), 7000);
      return;
    }

    setIsOracleLoading(true);
    setOracleError('');
    soundEngine.playClick();

    try {
      const data = await generateQuestSuggestions(inputSeed);
      
      if (!data || (data as any).error) {
        throw new Error('AI is unavailable. Please come back later.');
      }

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.difficulty) setDifficulty(data.difficulty as QuestDifficulty);
      if (data.category) setCategory(data.category as QuestCategory);
      
      soundEngine.playClick();
    } catch (err: any) {
      setOracleError('AI is unavailable. Please come back later.');
      setTimeout(() => setOracleError(''), 10000);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    soundEngine.playClick();
    onAddQuest({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      category,
      dueDate: dueDate.trim() || undefined
    });

    setTitle('');
    setDescription('');
    setDifficulty('Lesser Burden');
    setCategory('General');
    setDueDate('');
  };

  // Custom segmented selectors
  const difficulties: QuestDifficulty[] = ['Lesser Burden', 'Sinuous Vow', 'Mortal Penance'];
  const categories: QuestCategory[] = ['General', 'Vow', 'Trial', 'Crusade'];

  return (
    <View style={styles.formCard}>
      {/* Decorative corners */}
      <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 }]} />
      <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1 }]} />
      <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1 }]} />
      <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 }]} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Feather size={14} color={COLORS.gothicGold} />
          <Text style={styles.titleText}>Inscribe Penance Vow</Text>
        </View>

        <TouchableOpacity 
          style={[styles.oracleBtn, isOracleLoading && { opacity: 0.6 }]} 
          onPress={handleOracleSuggest}
          disabled={isOracleLoading}
        >
          {isOracleLoading ? (
            <ActivityIndicator size="small" color={COLORS.gothicGold} />
          ) : (
            <Text style={styles.oracleBtnText}>🔮 ORACLE TRANSLATE</Text>
          )}
        </TouchableOpacity>
      </View>

      {oracleError ? (
        <View style={styles.oracleErrorBox}>
          <Text style={styles.oracleErrorText}>✦ Whisper: {oracleError}</Text>
        </View>
      ) : null}

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>VOW DECLARATION / TASK TITLE *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.textInput}
          placeholder="E.g., Cleanse the study altar, defeat the email hoard..."
          placeholderTextColor={COLORS.gray700}
        />
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>GRAVE NARRATIVE DETAILS</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
          placeholder="E.g., Perform with high precision to earn the title of the absolved..."
          placeholderTextColor={COLORS.gray700}
        />
      </View>

      {/* Difficulty segment selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>SEVERITY / DIFFICULTY</Text>
        <View style={styles.segmentRow}>
          {difficulties.map(diff => {
            const isSelected = difficulty === diff;
            return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.segmentBtn,
                  isSelected && { borderColor: COLORS.gothicGold, backgroundColor: 'rgba(200, 158, 92, 0.15)' }
                ]}
                onPress={() => { soundEngine.playClick(); setDifficulty(diff); }}
              >
                <Text style={[styles.segmentBtnText, isSelected && { color: COLORS.gothicGold, fontWeight: 'bold' }]}>
                  {diff}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Category segment selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>QUEST COVENANT</Text>
        <View style={styles.segmentRow}>
          {categories.map(cat => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.segmentBtn,
                  isSelected && { borderColor: COLORS.gothicGold, backgroundColor: 'rgba(200, 158, 92, 0.15)' }
                ]}
                onPress={() => { soundEngine.playClick(); setCategory(cat); }}
              >
                <Text style={[styles.segmentBtnText, isSelected && { color: COLORS.gothicGold, fontWeight: 'bold' }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Due Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>HOUR OF JUDGMENT (YYYY-MM-DD)</Text>
        <TextInput
          value={dueDate}
          onChangeText={setDueDate}
          style={styles.textInput}
          placeholder="e.g. 2026-07-07"
          placeholderTextColor={COLORS.gray700}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Skull size={14} color="#fff" />
        <Text style={styles.submitBtnText}>INSCRIBE IN BLOOD</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    padding: 16,
    position: 'relative',
    marginVertical: 10,
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: COLORS.gothicGold,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontFamily: FONTS.cinzel,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  oracleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.4)',
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
  },
  oracleBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
  },
  oracleErrorBox: {
    padding: 8,
    backgroundColor: 'rgba(164, 44, 56, 0.1)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  oracleErrorText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicCrimson,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    width: '100%',
    height: 38,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
    fontSize: 12.5,
    fontFamily: FONTS.sans,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    backgroundColor: COLORS.gothicDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  submitBtn: {
    width: '100%',
    height: 40,
    backgroundColor: COLORS.gothicCrimson,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  submitBtnText: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  }
});
export default CreateQuestForm;
