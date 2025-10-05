import { VehicleList } from "@/components/vehicle/VehicleList";
import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function VehiclesPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/signin?callbackUrl=/vehicles");
  }

  return <VehicleList />;
}
