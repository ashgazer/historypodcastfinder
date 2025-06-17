.PHONY:
insert_data:
	@echo "Refreshing data..."
	@python get_feed_info.py

.PHONY:
delete_db:
	@echo "Deleting database..."
	@rm -f podcast.db

.PHONY:
refresh_db: delete_db insert_data
	@echo "Database refreshed."