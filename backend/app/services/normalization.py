import time

class NormalizationService:
    def normalize_metrics(self, raw_metrics: list[dict]) -> list[dict]:
        """
        Filters raw metrics and computes derived metrics (CPU, Memory, Disk).
        Returns a list of normalized metric objects.
        """
        normalized = []
        
        # Helper dicts to store components for calculation
        mem_total = 0
        mem_avail = 0
        
        fs_size = 0
        fs_free = 0
        
        # For CPU, we really need history to calculate % from counters.
        # We will try to find 'node_load1' as a proxy for "current load".
        cpu_load = None
        
        timestamp = int(time.time())

        for m in raw_metrics:
            name = m["name"]
            value = float(m["value"])
            labels = m.get("labels", {})

            # Memory
            if name == "node_memory_MemTotal_bytes":
                mem_total = value
            elif name == "node_memory_MemAvailable_bytes":
                mem_avail = value
            elif name == "node_memory_MemFree_bytes" and mem_avail == 0:
                # Fallback if Available not present (older kernels)
                mem_avail = value
            
            # Disk (Root partition usually, or aggregation)
            # Simplification: Look for root mount "/"
            if name == "node_filesystem_size_bytes" and labels.get("mountpoint") == "/":
                fs_size = value
            elif name == "node_filesystem_avail_bytes" and labels.get("mountpoint") == "/":
                fs_free = value
                
            # CPU Load (Gauge)
            if name == "node_load1":
                cpu_load = value

        # Compute Derived Metrics
        
        # 1. Memory Used Percent
        if mem_total > 0:
            used_percent = (mem_total - mem_avail) / mem_total
            normalized.append({
                "source": "prometheus",
                "category": "memory",
                "metric": "memory_used_percent",
                "value": round(used_percent, 4),
                "timestamp": timestamp
            })

        # 2. Disk Free Percent
        if fs_size > 0:
            free_percent = fs_free / fs_size
            normalized.append({
                "source": "prometheus",
                "category": "disk",
                "metric": "disk_free_percent",
                "value": round(free_percent, 4),
                "timestamp": timestamp
            })

        # 3. CPU (Using Load1 as proxy since we can't derive rate from counter in one pass)
        # Ideally we'd normalize this by core count, but for now raw load is better than nothing.
        if cpu_load is not None:
             normalized.append({
                "source": "prometheus",
                "category": "cpu",
                "metric": "cpu_load_1m", # Renamed to reflect it's load, not % usage
                "value": cpu_load,
                "timestamp": timestamp
            })
            
        return normalized

normalization_service = NormalizationService()
