"use client";

import { useActionState } from "react";
import { updateAccount } from "@/app/(login)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Team, User } from "@/lib/db/schema";

export type SettingsClientProps = {
  user: User | null;
  team: Team | null;
};

type AccountActionState = {
  name?: string;
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
    </>
  );
}
