import re
import requests
from datetime import datetime

class CleaningPipeline:
    def process_item(self, item, spider):
        if item.get('title'):
            item['title'] = self.clean_text(item['title'])
        if item.get('company'):
            item['company'] = self.clean_text(item['company'])
        if item.get('description'):
            item['description'] = self.clean_text(item['description'])
        if item.get('requirements'):
            item['requirements'] = self.clean_text(item['requirements'])
        
        return item
    
    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        return text.strip()


class DeduplicationPipeline:
    def __init__(self):
        self.seen = set()
    
    def process_item(self, item, spider):
        dedup_key = f"{item.get('source_id')}-{item.get('title')}-{item.get('company')}".lower()
        
        if dedup_key in self.seen:
            raise Exception(f"Duplicate item: {dedup_key}")
        
        self.seen.add(dedup_key)
        return item


class BackendPipeline:
    def __init__(self):
        self.jobs_buffer = []
        self.buffer_size = 10
    
    def process_item(self, item, spider):
        self.jobs_buffer.append(dict(item))
        
        if len(self.jobs_buffer) >= self.buffer_size:
            self.send_to_backend()
        
        return item
    
    def close_spider(self, spider):
        if self.jobs_buffer:
            self.send_to_backend()
    
    def send_to_backend(self):
        try:
            response = requests.post(
                'http://localhost:5000/api/jobs/ingest',
                json={'jobs': self.jobs_buffer},
                timeout=10
            )
            response.raise_for_status()
            print(f"Sent {len(self.jobs_buffer)} jobs to backend")
            self.jobs_buffer = []
        except Exception as e:
            print(f"Error sending to backend: {e}")
