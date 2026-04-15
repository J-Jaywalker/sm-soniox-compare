from abc import ABC, abstractmethod
from typing import List, Dict, Any
from providers.config import ProviderConfig, SupportedFeatures, FeatureState
from utils import info_message


DEBUG = True  # Whether to log connected providers


class BaseProvider(ABC):
    """
    Abstract base class for all STT/MT providers.
    """

    def __init__(self, config: ProviderConfig):
        self._is_connected = False
        self.error: Exception | None = None
        self.config: ProviderConfig = config

    def log_connected(self):
        if DEBUG:
            print(
                f"\n\nCONNECTED: {self.__class__.__name__}: {self.config.model_dump_json(indent=2)}"
            )

    def is_connected(self) -> bool:
        return self._is_connected

    def validate_provider_capabilities(self, name: str) -> List[Dict[str, Any]]:
        """
        Validates provider capabilities against the requested configuration.
        Modifies the config to disable unsupported features and returns a list of warnings.
        Raises ProviderError for fatal incompatibilities.
        """
        return validate_capabilities(self.get_available_features(), self.config, name)

    @abstractmethod
    async def connect(self) -> None:
        """
        Establish a connection to the provider.
        """
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """
        Close connection and clean up resources.
        """
        pass

    @abstractmethod
    async def send(self, data: bytes | str) -> None:
        """
        Send an audio chunk or string to the provider.
        """
        pass

    @abstractmethod
    async def send_end(self) -> None:
        """
        Send an end-of-stream signal to the provider.
        This is optional and may not be implemented by all providers.
        """
        pass

    @abstractmethod
    async def receive(self) -> List[Dict[str, Any]]:
        """
        Receive transcription or translation data.
        Should return a list of dictionaries.
        """
        pass

    @staticmethod
    @abstractmethod
    def get_available_features() -> SupportedFeatures:
        """
        Get supported features for each model.
        """
        pass


class ProviderError(Exception):
    """Base error for all provider-related exceptions."""

    def __init__(self, message, details=None):
        self.message = message
        self.details = details
        super().__init__(message)


def validate_capabilities(
    features: SupportedFeatures, config: ProviderConfig, provider: str
) -> List[Dict[str, Any]]:
    """
    Validates provider capabilities against the requested configuration.
    Modifies the config to disable unsupported features and returns a list of warnings.
    Raises ProviderError for fatal incompatibilities.
    """
    warnings: List[Dict[str, Any]] = []

    if config.params.mode == "mt":
        assert config.params.translation is not None, (
            "mt mode specified, but translation config is none."
        )

        if features.translation_one_way.state == FeatureState.UNSUPPORTED:
            # If one way translation if not supported, then two way translation
            # also can not be. This is a hard failure.
            raise ProviderError(f"Translation is not supported by {provider}.")

        if (
            config.params.translation.type == "one_way"
            and features.translation_one_way.state == FeatureState.PARTIAL
        ):
            warnings.append(
                info_message(
                    provider,
                    features.translation_one_way.comment
                    or "Translation from one language to another is only partially supported.",
                    level="info",
                )
            )

        if config.params.translation.type == "two_way":
            if features.translation_two_way.state == FeatureState.UNSUPPORTED:
                raise ProviderError(
                    f"Translation between two languages is not supported by {provider}."
                )
            elif features.translation_two_way.state == FeatureState.PARTIAL:
                warnings.append(
                    info_message(
                        provider,
                        features.translation_two_way.comment
                        or "Translation between two languages is only partially supported.",
                        level="info",
                    )
                )

    if config.params.enable_speaker_diarization:
        state = features.speaker_diarization
        if state.state == FeatureState.UNSUPPORTED:
            warnings.append(
                info_message(
                    provider,
                    "Speaker diarization is not supported by this provider and has been disabled.",
                    level="warning",
                )
            )
            config.params.enable_speaker_diarization = False
        elif state.state == FeatureState.PARTIAL:
            warnings.append(
                info_message(
                    provider,
                    state.comment or "Speaker diarization is partially supported.",
                    level="info",
                )
            )

    return warnings
