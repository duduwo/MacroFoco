import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID = 'macrofoco-reminders';
const REMINDER_ID_PREFIX = 'macrofoco-reminder-';
const PLANNED_ID_PREFIX = 'macrofoco-planned-';
const SCHEDULED_NOTIFY_OFFSET_KEY = '@MacroFoco:scheduledNotifyOffsetMinutes';

export type ReminderTime = {hour: number; minute: number};

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

async function ensureChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Lembretes',
    importance: AndroidImportance.HIGH,
  });
}

// `messages[index]` é o texto do lembrete de `times[index]` — permite uma
// mensagem diferente por horário (ex: personalizada por mascote no Perfil).
// Se faltar mensagem pra algum horário, repete a última da lista.
export async function scheduleDailyReminders(times: ReminderTime[], messages: string[]) {
  await ensureChannel();
  await cancelAllReminders();

  for (let index = 0; index < times.length; index++) {
    const {hour, minute} = times[index];
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }
    const body = messages[index] ?? messages[messages.length - 1];

    await notifee.createTriggerNotification(
      {
        id: `${REMINDER_ID_PREFIX}${index}`,
        title: 'MacroFoco',
        body,
        android: {channelId: CHANNEL_ID},
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      },
    );
  }
}

// Cancela só os lembretes diários fixos (12h/19h) — NÃO mexe nas
// notificações de itens do Planejamento, que usam outro prefixo de id.
export async function cancelAllReminders() {
  const triggerIds = await notifee.getTriggerNotificationIds();
  const reminderIds = triggerIds.filter(id => id.startsWith(REMINDER_ID_PREFIX));
  if (reminderIds.length > 0) {
    await notifee.cancelTriggerNotifications(reminderIds);
  }
}

// Preferência global (definida em Perfil, dentro de "Lembretes diários") de
// quanto tempo antes de cada refeição programada a notificação deve disparar.
// Substitui a escolha que antes era feita a cada agendamento em Organização —
// agora é uma única configuração aplicada a todas as programações novas.
export async function getScheduledNotifyOffsetMinutes(): Promise<0 | 5> {
  const saved = await AsyncStorage.getItem(SCHEDULED_NOTIFY_OFFSET_KEY);
  return saved === '0' ? 0 : 5;
}

// Agenda a notificação de um item planejado, no horário exato ou com
// antecedência (offsetMinutes). Se o horário resultante já passou, não
// agenda nada (evita notificação "atrasada" disparando na hora de salvar).
export async function schedulePlannedNotification(
  plannedItemId: string,
  targetTimestamp: number,
  offsetMinutes: 0 | 5,
  body: string,
): Promise<string | null> {
  const fireAt = targetTimestamp - offsetMinutes * 60 * 1000;
  if (fireAt <= Date.now()) return null;

  await ensureChannel();
  const notificationId = `${PLANNED_ID_PREFIX}${plannedItemId}`;

  await notifee.createTriggerNotification(
    {
      id: notificationId,
      title: 'MacroFoco',
      body,
      android: {channelId: CHANNEL_ID},
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt,
    },
  );

  return notificationId;
}

export async function cancelPlannedNotification(notificationId: string | undefined) {
  if (!notificationId) return;
  await notifee.cancelNotification(notificationId).catch(() => {});
}