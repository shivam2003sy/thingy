import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { T } from '../config/theme';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reference: string | null;
  created_at: string;
}

const TX_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  bet:    { icon: '🎯', color: '#F59E0B', label: 'Prediction Bet'  },
  win:    { icon: '🏆', color: '#22C55E', label: 'Prediction Win'  },
  bonus:  { icon: '🎁', color: '#A78BFA', label: 'Bonus'           },
  refund: { icon: '↩️', color: '#60A5FA', label: 'Refund'          },
  reward: { icon: '⭐', color: '#F59E0B', label: 'Reward'          },
};

function fmt(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function WalletScreen({ navigation }: { navigation: any }) {
  const { user, refreshProfile } = useAuthStore();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTxns = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setTxns(data);
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    fetchTxns().finally(() => setLoading(false));
  }, [fetchTxns]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTxns(), refreshProfile?.()]);
    setRefreshing(false);
  }, [fetchTxns, refreshProfile]);

  const totalWon  = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <Text style={{ color: T.text, fontWeight: '800', fontSize: 18 }}>Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={{ margin: 16 }}>
          <LinearGradient
            colors={[T.primary, T.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 28, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', letterSpacing: 1.5 }}>
              TOKEN BALANCE
            </Text>
            <Text style={{ color: '#FFF', fontSize: 52, fontWeight: '900', marginTop: 8 }}>
              {user?.tokens?.toLocaleString() ?? '0'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>🪙 Tokens</Text>
          </LinearGradient>
        </View>

        {/* Won / Spent summary */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: '#22C55E', fontSize: 22, fontWeight: '900' }}>+{totalWon.toLocaleString()}</Text>
            <Text style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>Total Earned</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: '#EF4444', fontSize: 22, fontWeight: '900' }}>-{totalSpent.toLocaleString()}</Text>
            <Text style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>Total Bet</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', ...T.shadowSm }}>
            <Text style={{ color: T.primary, fontSize: 22, fontWeight: '900' }}>{txns.length}</Text>
            <Text style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>Transactions</Text>
          </View>
        </View>

        {/* Transaction History */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16, marginBottom: 14 }}>
            Transaction History
          </Text>

          {loading ? (
            <ActivityIndicator color={T.primary} style={{ marginTop: 40 }} />
          ) : txns.length === 0 ? (
            <View style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 40, alignItems: 'center', ...T.shadow }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🪙</Text>
              <Text style={{ color: T.text, fontWeight: '700', fontSize: 16 }}>No transactions yet</Text>
              <Text style={{ color: T.textSec, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
                Start predicting to see your token history here
              </Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', ...T.shadow }}>
              {txns.map((tx, idx) => {
                const cfg = TX_CONFIG[tx.type] ?? { icon: '💰', color: T.primary, label: tx.type };
                const isPositive = tx.amount > 0;
                return (
                  <View key={tx.id}>
                    {idx > 0 && <View style={{ height: 1, backgroundColor: T.border }} />}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 }}>
                      {/* Icon */}
                      <View style={{
                        width: 42, height: 42, borderRadius: 12,
                        backgroundColor: isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)',
                        alignItems: 'center', justifyContent: 'center', marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 20 }}>{cfg.icon}</Text>
                      </View>

                      {/* Description */}
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: T.text, fontWeight: '700', fontSize: 14 }}>
                          {cfg.label}
                        </Text>
                        {tx.reference ? (
                          <Text style={{ color: T.textSec, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                            {tx.reference}
                          </Text>
                        ) : null}
                        <Text style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>
                          {fmt(tx.created_at)}
                        </Text>
                      </View>

                      {/* Amount */}
                      <Text style={{
                        color: isPositive ? '#22C55E' : '#EF4444',
                        fontWeight: '900', fontSize: 16,
                      }}>
                        {isPositive ? '+' : ''}{tx.amount.toLocaleString()} 🪙
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
