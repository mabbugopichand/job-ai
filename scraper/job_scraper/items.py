import scrapy

class JobItem(scrapy.Item):
    source_id = scrapy.Field()
    external_id = scrapy.Field()
    title = scrapy.Field()
    company = scrapy.Field()
    location = scrapy.Field()
    work_mode = scrapy.Field()
    role_type = scrapy.Field()
    employment_type = scrapy.Field()
    salary_min = scrapy.Field()
    salary_max = scrapy.Field()
    salary_currency = scrapy.Field()
    description = scrapy.Field()
    requirements = scrapy.Field()
    url = scrapy.Field()
    posted_date = scrapy.Field()
    raw_data = scrapy.Field()
