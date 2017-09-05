Attempt to iteratively build an initial TwoRavens image containing:

- RApache - rook services
- Django

Notes:
  - Excessively big package with apache2-dev - to get the apxs package for mod_wsgi


## Docker 1

- Most of the apt-get packages (but not RApache)
  ```
  docker build -f docker-work/docker1 -t 2raven-docker1 .
  ```

  - run a temp container with this image:
      ```
      docker run -ti --rm --name=ok_ravens1 2raven-docker1  
      ```

## Docker 2

```
docker build -f docker-work/docker2 -t 2raven-docker2 .
```

- run a temp container with this image:
    ```
    docker run -ti --rm --name=ok_ravens2 2raven-docker2:latest
    ```

  - Running the virtualenv:
      ```
      fab -f fab_mini.py virtualenv_start
      ```
```
echo WORKON_HOME=/srv/.virtualenvs >> /home/tr_user/.profile && \
echo PROJECT_HOME=/srv/Devel >> /home/tr_user/.profile && \
echo VIRTUALENVWRAPPER_PYTHON=/usr/bin/python3 >> /home/tr_user/.profile && \
echo VIRTUALENVWRAPPER_SCRIPT=/usr/local/bin/virtualenvwrapper.sh >> /home/tr_user/.profile
```
