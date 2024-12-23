import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2/options";

import {
  countFollowersOnWrite,
  countFollowingOnWrite,
  countPostLikesOnWrite,
} from "./postFunctions";
import { updateAllSpotAddresses } from "./spotFunctions";
import {
  clusterAllSpotsOnRun,
  clusterAllSpotsOnSchedule,
} from "./spotClusteringFunctions";
import { fixSpotLocations } from "./fixFunctions";

setGlobalOptions({ maxInstances: 10 });
admin.initializeApp();

// post functions
export { countFollowersOnWrite, countFollowingOnWrite, countPostLikesOnWrite };

// spot functions
export { updateAllSpotAddresses };

// spot clustering functions
export { clusterAllSpotsOnRun, clusterAllSpotsOnSchedule };

// fixes
export { fixSpotLocations };
