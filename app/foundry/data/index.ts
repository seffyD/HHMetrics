import { ROG_ALLY_X } from "./rog-ally-x";
import { GPD_WIN_MAX_2 } from "./gpd-win-max-2";
import { STEAM_DECK_OLED } from "./steam-deck-oled";
import { MSI_CLAW_A1M } from "./msi-claw-a1m";

export const DEVICE_REGISTRY = {
    "rog-ally-x": ROG_ALLY_X,
    "gpd-win-max-2": GPD_WIN_MAX_2,
    "steam-deck-oled": STEAM_DECK_OLED,
    "msi-claw-a1m": MSI_CLAW_A1M,
};

export const DEVICES_LIST = Object.values(DEVICE_REGISTRY);
