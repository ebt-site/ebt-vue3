# syntax=docker/dockerfile:1
FROM ubuntu:22.04
LABEL maintainer="karl@oyamist.com"
RUN apt-get update && apt-get upgrade -y
#SHELL [ "/bin/bash", "-c" ]
ENV INSTALL="apt-get --no-install-recommends install -y "

RUN <<GITHUB_ACTION
  $INSTALL sudo
  $INSTALL git
  git config --global pull.rebase true 
  $INSTALL lsb-release
  $INSTALL curl
  $INSTALL ca-certificates
  curl -sL https://deb.nodesource.com/setup_16.x | bash -
  $INSTALL nodejs
GITHUB_ACTION

RUN <<TOOLS
  $INSTALL vim
TOOLS

RUN echo "unroot    ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
RUN useradd unroot -s /bin/bash -m 
RUN usermod -aG sudo unroot
ENV USER=unroot

USER $USER
RUN <<EBT_VUE3
  cd ~
  git clone https://github.com/ebt-site/ebt-vue3
  cd ebt-vue3
EBT_VUE3

USER root
CMD [ "bash", "-c", "su -l unroot" ]
