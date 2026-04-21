import scrapy
from job_scraper.items import JobItem

class BaseJobSpider(scrapy.Spider):
    def __init__(self, source_id=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.source_id = source_id
    
    def create_job_item(self, **kwargs):
        item = JobItem()
        item['source_id'] = self.source_id
        
        for key, value in kwargs.items():
            if key in item.fields:
                item[key] = value
        
        return item
    
    def extract_salary(self, salary_text):
        if not salary_text:
            return None, None, None
        
        import re
        numbers = re.findall(r'\d+[,\d]*', salary_text.replace(',', ''))
        
        if len(numbers) >= 2:
            return int(numbers[0]), int(numbers[1]), 'USD'
        elif len(numbers) == 1:
            return int(numbers[0]), None, 'USD'
        
        return None, None, None
