"use client";

import { useActionState, useState } from "react";
import { updateAccount, updateBotConfig } from "@/app/(login)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check } from "lucide-react";
import { Team, User } from "@/lib/db/schema";
import { useSelectedClient } from "../SelectedClientContext";

export type SettingsClientProps = {
  user: User | null;
  team: Team | null;
};

type AccountActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type BotConfigActionState = {
  botName?: string;
  mailboxName?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: AccountActionState;
  nameValue?: string;
  emailValue?: string;
};

function AccountForm({ state, nameValue = "", emailValue = "" }: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">Name</Label>
        <Input id="name" name="name" placeholder="Enter your name" defaultValue={state.name || nameValue} required />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">Email</Label>
        <Input id="email" name="email" type="email" placeholder="Enter your email" defaultValue={emailValue} required />
      </div>
    </>
  );
}

export default function SettingsClient({ user, team }: SettingsClientProps) {
  const [state, formAction, isPending] = useActionState<AccountActionState, FormData>(updateAccount, {});
  const [botState, botFormAction, isBotPending] = useActionState<BotConfigActionState, FormData>(updateBotConfig, {});
  const [showFirewallEmail, setShowFirewallEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const { selectedClient } = useSelectedClient();

  const generateFirewallEmail = () => {
    const clientName = selectedClient?.name || "[Client Name]";
    const botName = team?.botName || "[Bot Name]";
    const botNameEncoded = encodeURIComponent(botName);
    const mailboxName = team?.mailboxName || "[mailbox]";
    const userName = user?.name || "[Your Name]";

    return `Dear ${clientName},

To make things easier, I use a small automated assistant to help collect documents and organise the paperwork for you.

Their name is ${botName} and their email address is ${mailboxName}@ifagent.co.uk

Because some organisations block email from new senders, my assistant can only reply to you after you send it an initial message. This keeps everything transparent and ensures you stay in control of what you receive.

What to do:
Please send a short email to my assistant at:

${mailboxName}@ifagent.co.uk

You can simply write:

"Hi ${botName} — please help me with the paperwork"

Or, if your device supports it, you can click or paste this link into your browser to pre-fill the message:

mailto:${mailboxName}@ifagent.co.uk?subject=Start%20Paperwork&body=Hi%20${botNameEncoded}%2C%20please%20help%20me%20get%20started.%0A

What happens next:

    ${botName} will send you a simple "Hello" reply email to make sure comm are working.

    Your data is handled securely and only used for your paperwork.

If you run into any issues, just let me know and I'll help.

Best regards,
${userName}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateFirewallEmail());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const isBotConfigured = Boolean(team?.botName && team?.mailboxName);

  return (
    <>
      <div className="mb-4">
        <Label>My Team ID</Label>
        <Input value={team?.id ?? ''} readOnly className="bg-gray-100" />
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={formAction}>
            <AccountForm state={state} nameValue={user?.name ?? ""} emailValue={user?.email ?? ""} />
            {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
            {state.success && <p className="text-green-500 text-sm">{state.success}</p>}
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={isPending}>
              {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>
            Configure your team's AI assistant name and email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={botFormAction}>
            <div>
              <Label htmlFor="botName" className="mb-2">Bot Name</Label>
              <Input
                id="botName"
                name="botName"
                type="text"
                placeholder="e.g., Bob the Bot"
                defaultValue={botState.botName ?? team?.botName ?? ''}
              />
            </div>
            <div>
              <Label htmlFor="mailboxName" className="mb-2">Mailbox Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="mailboxName"
                  name="mailboxName"
                  type="text"
                  placeholder="e.g., bob-the-bot"
                  defaultValue={botState.mailboxName ?? team?.mailboxName ?? ''}
                  className="w-80"
                  maxLength={64}
                />
                <span className="text-muted-foreground font-mono">@ifagent.co.uk</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Use lowercase letters, numbers, hyphens, and dots only. Must be unique across all teams.
              </p>
            </div>
            {botState.error && <p className="text-red-500 text-sm">{botState.error}</p>}
            {botState.success && <p className="text-green-500 text-sm">{botState.success}</p>}
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={isBotPending}>
              {isBotPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : 'Save Changes'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setShowFirewallEmail(!showFirewallEmail)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={!isBotConfigured}
              >
                {showFirewallEmail ? 'Hide' : 'Compose'} Firewall Email
              </Button>
              {showFirewallEmail && (
                <Button
                  type="button"
                  onClick={handleCopy}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!isBotConfigured}
                >
                  {copied ? (
                    <><Check className="mr-2 h-4 w-4" />Copied!</>
                  ) : (
                    <><Copy className="mr-2 h-4 w-4" />Copy Email</>
                  )}
                </Button>
              )}
            </div>
            {!isBotConfigured && (
              <p className="text-sm text-muted-foreground mt-2">
                Please configure bot name and mailbox name above to enable this feature.
              </p>
            )}

            {showFirewallEmail && (
              <div className="mt-4">
                <Label htmlFor="firewallEmail" className="mb-2">Email Template</Label>
                <textarea
                  id="firewallEmail"
                  className="w-full h-96 p-3 border rounded-md font-mono text-sm resize-y"
                  value={generateFirewallEmail()}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Click the text area to select all, or use the Copy Email button above.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
