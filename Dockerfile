# syntax=docker/dockerfile:1
FROM ubuntu:22.04
LABEL maintainer="karl@oyamist.com"
RUN apt-get update && apt-get upgrade -y
#SHELL [ "/bin/bash", "-c" ]
ENV INSTALL="apt-get --no-install-recommends install -y "

RUN <<TOOLS
  $INSTALL sudo
  $INSTALL git
  git config --global pull.rebase true 
  $INSTALL lsb-release
  $INSTALL curl
  $INSTALL vim
  $INSTALL ca-certificates
  curl -sL https://deb.nodesource.com/setup_16.x | bash -
  $INSTALL nodejs
TOOLS

RUN echo "unroot    ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
RUN useradd unroot -s /bin/bash -m 
RUN usermod -aG sudo unroot
ENV USER=unroot

USER $USER
ENV APPDIR=/home/$USER/ebt-vue3/
WORKDIR $APPDIR
COPY --link --chown=$USER package* $APPDIR
RUN <<EBT_VUE3
  mkdir -p $APPDIR/local
  cd $APPDIR
  echo "cd $APPDIR" >> ~/.bashrc
EBT_VUE3
COPY --link --chown=$USER . $APPDIR

USER root
CMD [ "bash", "-c", "su -l unroot" ]
