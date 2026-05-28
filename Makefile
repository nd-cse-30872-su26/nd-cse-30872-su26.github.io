# Configuration

DOCROOT=	public
PREFIX=		$(shell awk '/prefix/ {print $$2}' site.yaml)
WWWROOT=	weasel:$(HOME)/www/courses/$(PREFIX)
YASB=		scripts/yasb.py

# Rules

build:
	@$(YASB)

test:
	echo $(WWWROOT)

install:	build
	@rsync -av --progress --delete \
		--include='courses/*.html' \
		--exclude='archive' \
		--exclude='courses/*' \
		$(DOCROOT)/. $(WWWROOT)/.

clean:
	@echo Cleaning...
	@rm -fr $(DOCROOT)
