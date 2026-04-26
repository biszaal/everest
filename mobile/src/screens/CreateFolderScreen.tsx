import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { KeyboardSafeView } from '@/components/KeyboardSafeView';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useFolders } from '@/hooks/useFolders';
import type { MainStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const CreateFolderScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { create } = useFolders();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const created = await create(name.trim(), description.trim() || undefined);
      nav.replace('Folder', { folderId: created.playlistId });
    } catch (err) {
      Alert.alert('Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <ScreenHeader title="New folder" onBack={() => nav.goBack()} />
      <KeyboardSafeView dismissOnTap>
        <ScrollView className="flex-1 px-5 pt-2" keyboardShouldPersistTaps="handled">
          <Text className="text-text-muted mb-5">Group related videos together.</Text>
          <Input label="Name" placeholder="Nepal Election 2026" value={name} onChangeText={setName} />
          <Input
            label="Description (optional)"
            placeholder="Notes, context, anything"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button title="Create" onPress={onSubmit} loading={loading} fullWidth disabled={!name.trim()} />
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
};
