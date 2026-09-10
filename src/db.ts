import { Batch, AnimalEvaluation } from './types';
import { auth } from './lib/firebase';

const getToken = async () => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken();
};

const fetchApi = async (url: string, options: RequestInit = {}) => {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errText = await response.text();
    const error = new Error(`API call failed: ${response.status} ${response.statusText} - ${errText}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};

export const db = {
  batches: {
    add: async (batch: Batch) => {
      return fetchApi('/api/batches', {
        method: 'POST',
        body: JSON.stringify(batch)
      });
    },
    put: async (batch: Batch) => {
      // Put implies insert or update
      return fetchApi('/api/batches', {
        method: 'POST',
        body: JSON.stringify(batch)
      });
    },
    update: async (id: string, updates: Partial<Batch>) => {
      // Not implemented in backend yet, doing full replace via POST
       const batch = await fetchApi(`/api/batches/${id}`);
       return fetchApi('/api/batches', {
        method: 'POST',
        body: JSON.stringify({ ...batch, ...updates })
      });
    },
    delete: async (id: string) => {
       // Currently backend doesn't have delete batch, but historyTab tries to delete.
       // It will fail or be ignored since we didn't implement backend batch deletion.
       // Let's implement it in the backend shortly.
       return fetchApi(`/api/batches/${id}`, { method: 'DELETE' });
    },
    clear: async () => {
      // We shouldn't actually clear all in the cloud. Let's ignore.
      console.warn("db.batches.clear() called, ignoring in cloud mode");
    },
    orderBy: (field: string) => ({
      toArray: async () => {
         const batches = await fetchApi('/api/batches');
         return batches; // Backend already orders by date desc
      }
    }),
    toArray: async () => fetchApi('/api/batches'),
    get: async (id: string) => {
      try {
        return await fetchApi(`/api/batches/${id}`);
      } catch (e: any) {
        if (e.status === 404) return null;
        throw e;
      }
    }
  },
  evaluations: {
    add: async (evaluation: AnimalEvaluation) => {
      return fetchApi('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify(evaluation)
      });
    },
    put: async (evaluation: AnimalEvaluation) => {
      return fetchApi('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify(evaluation)
      });
    },
    get: async (query: { batchId: string, animalIndex: number }) => {
       try {
         const evals = await fetchApi(`/api/evaluations/${query.batchId}`);
         return evals.find((e: AnimalEvaluation) => e.animalIndex === query.animalIndex);
       } catch (e: any) {
         if (e.status === 404) return undefined;
         throw e;
       }
    },
    where: (field: string) => ({
      equals: (value: string) => ({
        toArray: async () => {
           if (field === 'batchId') {
              try {
                return await fetchApi(`/api/evaluations/${value}`);
              } catch (e: any) {
                if (e.status === 404) return [];
                throw e;
              }
           }
           return [];
        },
        delete: async () => {
           // Not fully implemented on backend, ignore for now
        }
      })
    }),
    clear: async () => {
      console.warn("db.evaluations.clear() called, ignoring in cloud mode");
    }
  }
};
